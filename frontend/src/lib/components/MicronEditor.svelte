<script lang="ts">
	import {
		AppWindow,
		BookOpen,
		Braces,
		Check,
		ChevronDown,
		Copy,
		Download,
		Maximize2,
		Minimize2,
		Plus,
		Redo2,
		RefreshCw,
		RotateCcw,
		Trash2,
		Type,
		Undo2,
		X
	} from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { ensureMicronParser, convertMicron, clearMicronParserLoad } from '$lib/micron-parser';
	import {
		DEFAULT_MICRON_SAMPLE,
		loadMicronEditorState,
		saveMicronEditorState,
		MICRON_SNIPPETS,
		insertAtCursor,
		createTab,
		tabDownloadName,
		sanitizeTabName,
		type MicronTab
	} from '$lib/micron-editor-state';
	import {
		findMicronColors,
		findMicronColorAt,
		micronToHex6,
		hex6ToMicron,
		replaceMicronColorAt,
		type MicronColorMatch
	} from '$lib/micron-colors';

	type LoadStatus = 'loading' | 'ready' | 'error';

	let { popout = false }: { popout?: boolean } = $props();

	const saved = loadMicronEditorState();

	const initialSource =
		saved.tabs.find((tab) => tab.id === saved.activeTabId)?.source ?? DEFAULT_MICRON_SAMPLE;

	let tabs = $state<MicronTab[]>(saved.tabs);
	let activeTabId = $state(saved.activeTabId);
	let monospace = $state(saved.monospace);
	let source = $state(initialSource);

	let loadStatus = $state<LoadStatus>('loading');
	let loadError = $state('');
	let previewHtml = $state('');
	let copied = $state(false);
	let darkTheme = $state(true);
	let cheatsheetOpen = $state(false);
	let snippetsOpen = $state(false);
	let retryNonce = $state(0);
	let fullscreen = $state(false);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let rootEl = $state<HTMLElement | null>(null);
	let popoutWindow: Window | null = null;

	let renamingTabId = $state<string | null>(null);
	let renameValue = $state('');
	let renameInputEl = $state<HTMLInputElement | null>(null);

	let undoStack = $state<string[]>([]);
	let redoStack = $state<string[]>([]);
	let previousSource = $state(initialSource);
	let suppressHistory = false;
	let suppressTabSync = false;

	let lastTapId = '';
	let lastTapTime = 0;

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let rafId: number | undefined;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	let historyTimer: ReturnType<typeof setTimeout> | undefined;

	const lineCount = $derived(source.split('\n').length);
	const charCount = $derived(source.length);
	const colorMatches = $derived(findMicronColors(source));
	const activeTab = $derived(tabs.find((tab) => tab.id === activeTabId));
	const canUndo = $derived(undoStack.length > 0);
	const canRedo = $derived(redoStack.length > 0);
	type OverlayMetrics = {
		paddingTop: number;
		paddingLeft: number;
		lineHeight: number;
		charWidth: number;
		scrollTop: number;
		scrollLeft: number;
	};

	let overlayMetrics = $state<OverlayMetrics>({
		paddingTop: 0,
		paddingLeft: 0,
		lineHeight: 0,
		charWidth: 0,
		scrollTop: 0,
		scrollLeft: 0
	});

	let measureCanvas: HTMLCanvasElement | undefined;

	function flushActiveToTabs() {
		const idx = tabs.findIndex((tab) => tab.id === activeTabId);
		if (idx < 0 || tabs[idx].source === source) return;
		tabs = tabs.map((tab, i) => (i === idx ? { ...tab, source } : tab));
	}

	function pushUndoSnapshot(snapshot: string) {
		if (snapshot === source) return;
		const top = undoStack[undoStack.length - 1];
		if (top === snapshot) return;
		undoStack = [...undoStack.slice(-79), snapshot];
		redoStack = [];
	}

	function applySource(next: string, pushHistory = false) {
		if (pushHistory) pushUndoSnapshot(source);
		suppressHistory = true;
		source = next;
		flushActiveToTabs();
		previousSource = next;
		queueMicrotask(() => {
			suppressHistory = false;
		});
	}

	function undo() {
		if (undoStack.length === 0) return;
		const snapshot = undoStack[undoStack.length - 1];
		undoStack = undoStack.slice(0, -1);
		redoStack = [...redoStack, source];
		suppressHistory = true;
		source = snapshot;
		flushActiveToTabs();
		previousSource = snapshot;
		suppressHistory = false;
	}

	function redo() {
		if (redoStack.length === 0) return;
		const snapshot = redoStack[redoStack.length - 1];
		redoStack = redoStack.slice(0, -1);
		undoStack = [...undoStack, source];
		suppressHistory = true;
		source = snapshot;
		flushActiveToTabs();
		previousSource = snapshot;
		suppressHistory = false;
	}

	function scheduleHistoryPush() {
		if (historyTimer) clearTimeout(historyTimer);
		historyTimer = setTimeout(() => {
			historyTimer = undefined;
			if (previousSource !== source) {
				pushUndoSnapshot(previousSource);
				previousSource = source;
			}
		}, 350);
	}

	function switchTab(id: string) {
		if (id === activeTabId) return;
		flushActiveToTabs();
		suppressTabSync = true;
		activeTabId = id;
		const tab = tabs.find((item) => item.id === id);
		const next = tab?.source ?? '';
		suppressHistory = true;
		source = next;
		previousSource = next;
		undoStack = [];
		redoStack = [];
		suppressHistory = false;
		suppressTabSync = false;
	}

	function handleTabClick(tab: MicronTab) {
		if (renamingTabId) return;
		const now = Date.now();
		if (lastTapId === tab.id && now - lastTapTime < 400) {
			startRename(tab);
			lastTapId = '';
			lastTapTime = 0;
			return;
		}
		lastTapId = tab.id;
		lastTapTime = now;
		switchTab(tab.id);
	}

	function startRename(tab: MicronTab) {
		renamingTabId = tab.id;
		renameValue = tab.name;
		queueMicrotask(() => {
			renameInputEl?.focus();
			renameInputEl?.select();
		});
	}

	function cancelRename() {
		renamingTabId = null;
		renameValue = '';
	}

	function commitRename() {
		if (!renamingTabId) return;
		const name = sanitizeTabName(renameValue);
		tabs = tabs.map((tab) => (tab.id === renamingTabId ? { ...tab, name } : tab));
		cancelRename();
	}

	function addTab() {
		flushActiveToTabs();
		const nextIndex = tabs.length + 1;
		const tab = createTab(`page-${nextIndex}`, '> New page\n\n');
		tabs = [...tabs, tab];
		switchTab(tab.id);
	}

	function closeTab(id: string, event: MouseEvent) {
		event.stopPropagation();
		if (tabs.length <= 1) return;
		flushActiveToTabs();
		const idx = tabs.findIndex((tab) => tab.id === id);
		tabs = tabs.filter((tab) => tab.id !== id);
		if (activeTabId === id) {
			const neighbor = tabs[Math.min(idx, tabs.length - 1)];
			switchTab(neighbor.id);
		}
		if (renamingTabId === id) cancelRename();
	}

	function renderPreview() {
		if (loadStatus !== 'ready') return;
		try {
			previewHtml = convertMicron(source, darkTheme, monospace);
		} catch {
			previewHtml = '';
		}
	}

	function schedulePreview() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (rafId !== undefined) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				rafId = undefined;
				renderPreview();
			});
		}, 50);
	}

	function scheduleSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			flushActiveToTabs();
			saveMicronEditorState({ tabs, activeTabId, monospace });
		}, 300);
	}

	function resetSample() {
		applySource(DEFAULT_MICRON_SAMPLE, true);
	}

	function clearSource() {
		applySource('', true);
	}

	async function copySource() {
		try {
			await navigator.clipboard.writeText(source);
			copied = true;
			if (copyTimer) clearTimeout(copyTimer);
			copyTimer = setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			/* ignore clipboard errors */
		}
	}

	function downloadMu() {
		const name = tabDownloadName(activeTab?.name ?? 'index');
		const blob = new Blob([source], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = name;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function retryLoad() {
		clearMicronParserLoad();
		retryNonce += 1;
	}

	function toggleFullscreen() {
		fullscreen = !fullscreen;
	}

	function popOutEditor() {
		if (popout || typeof window === 'undefined') return;
		flushActiveToTabs();
		saveMicronEditorState({ tabs, activeTabId, monospace });
		const url = `${window.location.origin}/tools/micron-editor?popout=1`;
		const features = 'popup=yes,width=1400,height=900,menubar=no,toolbar=no,location=yes,status=no';
		if (popoutWindow && !popoutWindow.closed) {
			popoutWindow.focus();
			return;
		}
		popoutWindow = window.open(url, 'micron-editor-popout', features);
		popoutWindow?.focus();
	}

	function insertSnippet(insert: string) {
		const el = textareaEl;
		if (!el) return;
		pushUndoSnapshot(source);
		const cursor = el.selectionStart ?? source.length;
		const result = insertAtCursor(source, cursor, insert);
		suppressHistory = true;
		source = result.source;
		flushActiveToTabs();
		previousSource = result.source;
		suppressHistory = false;
		queueMicrotask(() => {
			el.focus();
			el.setSelectionRange(result.cursor, result.cursor);
		});
	}

	let colorDragBase: string | null = null;
	let hoveredColor = $state<MicronColorMatch | null>(null);
	let colorPopoverPinned = $state(false);
	let colorHideTimer: ReturnType<typeof setTimeout> | undefined;
	let sourcePaneEl = $state<HTMLElement | null>(null);

	function changeColor(match: MicronColorMatch, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (colorDragBase === null) {
			colorDragBase = source;
			pushUndoSnapshot(source);
		}
		const next = replaceMicronColorAt(source, match, hex6ToMicron(input.value));
		if (next === source) return;
		suppressHistory = true;
		source = next;
		flushActiveToTabs();
		previousSource = next;
		suppressHistory = false;
		const refreshed = findMicronColorAt(next, match.index);
		if (refreshed) hoveredColor = refreshed;
	}

	function finishColorDrag() {
		colorDragBase = null;
	}

	function measureCharWidth(font: string): number {
		if (typeof document === 'undefined') return 8;
		measureCanvas ??= document.createElement('canvas');
		const ctx = measureCanvas.getContext('2d');
		if (!ctx) return 8;
		ctx.font = font;
		const width = ctx.measureText('M').width;
		if (width > 0) return width;
		const pxIndex = font.indexOf('px');
		let fontSize = 14;
		if (pxIndex > 0) {
			const start = font.lastIndexOf(' ', pxIndex - 1) + 1;
			const parsed = Number.parseFloat(font.slice(start, pxIndex));
			if (Number.isFinite(parsed) && parsed > 0) fontSize = parsed;
		}
		return fontSize * 0.6;
	}

	function updateOverlayMetrics() {
		const el = textareaEl;
		if (!el) return;
		const style = getComputedStyle(el);
		const paddingTop = parseFloat(style.paddingTop) || 0;
		const paddingLeft = parseFloat(style.paddingLeft) || 0;
		const fontSize = parseFloat(style.fontSize) || 14;
		const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.625;
		const font = style.font || `${style.fontSize} ${style.fontFamily}`;
		overlayMetrics = {
			paddingTop,
			paddingLeft,
			lineHeight,
			charWidth: measureCharWidth(font),
			scrollTop: el.scrollTop,
			scrollLeft: el.scrollLeft
		};
	}

	function syncScroll() {
		updateOverlayMetrics();
		if (hoveredColor && !colorPopoverPinned) {
			hoveredColor = findMicronColorAt(source, hoveredColor.index);
		}
	}

	function offsetFromPointer(clientX: number, clientY: number): number | null {
		const el = textareaEl;
		if (!el || overlayMetrics.charWidth <= 0 || overlayMetrics.lineHeight <= 0) return null;
		const rect = el.getBoundingClientRect();
		const x = clientX - rect.left + el.scrollLeft - overlayMetrics.paddingLeft;
		const y = clientY - rect.top + el.scrollTop - overlayMetrics.paddingTop;
		if (x < 0 || y < 0) return null;
		const line = Math.floor(y / overlayMetrics.lineHeight);
		const column = Math.floor(x / overlayMetrics.charWidth);
		const lines = source.split('\n');
		if (line < 0 || line >= lines.length) return null;
		let offset = 0;
		for (let i = 0; i < line; i++) offset += lines[i].length + 1;
		offset += Math.min(Math.max(column, 0), lines[line].length);
		return offset;
	}

	function showColorAtPointer(clientX: number, clientY: number) {
		updateOverlayMetrics();
		const offset = offsetFromPointer(clientX, clientY);
		if (offset === null) {
			if (!colorPopoverPinned) hoveredColor = null;
			return;
		}
		const match = findMicronColorAt(source, offset);
		if (match) {
			if (colorHideTimer) {
				clearTimeout(colorHideTimer);
				colorHideTimer = undefined;
			}
			hoveredColor = match;
			return;
		}
		if (!colorPopoverPinned) scheduleHideColorPopover();
	}

	function onSourceMouseMove(event: MouseEvent) {
		if (colorPopoverPinned) return;
		showColorAtPointer(event.clientX, event.clientY);
	}

	function onSourceMouseLeave() {
		if (colorPopoverPinned) return;
		scheduleHideColorPopover();
	}

	function scheduleHideColorPopover() {
		if (colorHideTimer) clearTimeout(colorHideTimer);
		colorHideTimer = setTimeout(() => {
			colorHideTimer = undefined;
			if (!colorPopoverPinned) hoveredColor = null;
		}, 160);
	}

	function pinColorPopover() {
		if (colorHideTimer) {
			clearTimeout(colorHideTimer);
			colorHideTimer = undefined;
		}
		colorPopoverPinned = true;
	}

	function unpinColorPopover() {
		colorPopoverPinned = false;
		scheduleHideColorPopover();
	}

	function colorPopoverStyle(match: MicronColorMatch): string {
		const m = overlayMetrics;
		const pane = sourcePaneEl;
		const paneWidth = pane?.clientWidth ?? 320;
		const popoverWidth = 168;
		const popoverHeight = 44;
		let top = m.paddingTop + (match.line + 1) * m.lineHeight - m.scrollTop + 6;
		let left = m.paddingLeft + match.column * m.charWidth - m.scrollLeft;
		if (top + popoverHeight > (pane?.clientHeight ?? 0) - 8) {
			top = m.paddingTop + match.line * m.lineHeight - m.scrollTop - popoverHeight - 6;
		}
		left = Math.max(8, Math.min(left, paneWidth - popoverWidth - 8));
		top = Math.max(8, top);
		return `top: ${top}px; left: ${left}px`;
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (renamingTabId) return;
		const mod = event.metaKey || event.ctrlKey;
		if (!mod) return;
		if (event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			undo();
			return;
		}
		if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
			event.preventDefault();
			redo();
		}
	}

	function handleRenameKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitRename();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelRename();
		}
	}

	const iconBtn =
		'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md px-2 text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:disabled:hover:bg-transparent dark:disabled:hover:text-zinc-400';

	const toggleChipBtn =
		'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200/70 hover:text-[#00ADD8] dark:text-zinc-400 dark:hover:bg-zinc-800';

	$effect(() => {
		if (typeof window === 'undefined' || typeof document === 'undefined') return;
		void retryNonce;
		let cancelled = false;
		loadStatus = 'loading';
		loadError = '';
		darkTheme = document.documentElement.classList.contains('dark');
		const observer = new MutationObserver(() => {
			const next = document.documentElement.classList.contains('dark');
			if (!cancelled && next !== darkTheme) darkTheme = next;
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		void ensureMicronParser()
			.then(() => {
				if (cancelled) return;
				loadError = '';
				loadStatus = 'ready';
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				loadError = err instanceof Error ? err.message : String(err);
				loadStatus = 'error';
			});

		return () => {
			cancelled = true;
			observer.disconnect();
		};
	});

	$effect(() => {
		if (loadStatus !== 'ready') return;
		void source;
		void monospace;
		void darkTheme;
		schedulePreview();
		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			if (rafId !== undefined) {
				cancelAnimationFrame(rafId);
				rafId = undefined;
			}
		};
	});

	$effect(() => {
		if (suppressTabSync) return;
		void source;
		void activeTabId;
		flushActiveToTabs();
	});

	$effect(() => {
		void tabs;
		void activeTabId;
		void monospace;
		scheduleSave();
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	$effect(() => {
		if (suppressHistory) return;
		void source;
		scheduleHistoryPush();
		return () => {
			if (historyTimer) clearTimeout(historyTimer);
		};
	});

	$effect(() => {
		if (!fullscreen && !popout) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	$effect(() => {
		void source;
		void colorMatches;
		void monospace;
		void fullscreen;
		queueMicrotask(() => updateOverlayMetrics());
	});

	$effect(() => {
		const el = textareaEl;
		if (!el || typeof window === 'undefined') return;
		const onResize = () => updateOverlayMetrics();
		window.addEventListener('resize', onResize);
		queueMicrotask(() => updateOverlayMetrics());
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<svelte:window onkeydown={handleEditorKeydown} />

<div class="min-w-0 max-w-full overflow-x-clip">
	<div
		bind:this={rootEl}
		class="flex min-w-0 flex-col overflow-hidden border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 {fullscreen ||
		popout
			? 'fixed inset-0 z-50 h-dvh rounded-none border-0 pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'
			: 'h-[min(85dvh,52rem)] rounded-xl md:h-[calc(100dvh-11rem)]'}"
	>
		<div
			class="flex min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/60"
		>
			<button
				type="button"
				onclick={undo}
				disabled={!canUndo}
				aria-label={$t('tools.micron_editor.undo')}
				title={$t('tools.micron_editor.undo')}
				class={iconBtn}
			>
				<Undo2 class="h-4 w-4" aria-hidden="true" />
			</button>
			<button
				type="button"
				onclick={redo}
				disabled={!canRedo}
				aria-label={$t('tools.micron_editor.redo')}
				title={$t('tools.micron_editor.redo')}
				class={iconBtn}
			>
				<Redo2 class="h-4 w-4" aria-hidden="true" />
			</button>

			<div class="mx-0.5 h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></div>

			<button
				type="button"
				onclick={resetSample}
				aria-label={$t('tools.micron_editor.reset')}
				title={$t('tools.micron_editor.reset')}
				class={iconBtn}
			>
				<RotateCcw class="h-4 w-4" aria-hidden="true" />
				<span class="hidden sm:inline">{$t('tools.micron_editor.reset')}</span>
			</button>
			<button
				type="button"
				onclick={clearSource}
				aria-label={$t('tools.micron_editor.clear')}
				title={$t('tools.micron_editor.clear')}
				class={iconBtn}
			>
				<Trash2 class="h-4 w-4" aria-hidden="true" />
				<span class="hidden sm:inline">{$t('tools.micron_editor.clear')}</span>
			</button>

			<div class="mx-0.5 h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></div>

			<button
				type="button"
				onclick={copySource}
				aria-label={copied ? $t('tools.micron_editor.copied') : $t('tools.micron_editor.copy')}
				title={copied ? $t('tools.micron_editor.copied') : $t('tools.micron_editor.copy')}
				class={iconBtn}
			>
				{#if copied}
					<Check class="h-4 w-4 text-[#00ADD8]" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.copied')}</span>
				{:else}
					<Copy class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.copy')}</span>
				{/if}
			</button>
			<button
				type="button"
				onclick={downloadMu}
				aria-label={$t('tools.micron_editor.download')}
				title={$t('tools.micron_editor.download')}
				class={iconBtn}
			>
				<Download class="h-4 w-4" aria-hidden="true" />
				<span class="hidden sm:inline">{$t('tools.micron_editor.download')}</span>
			</button>

			<div class="mx-0.5 h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></div>

			<button
				type="button"
				onclick={() => (monospace = !monospace)}
				aria-pressed={monospace}
				aria-label={$t('tools.micron_editor.monospace')}
				title={$t('tools.micron_editor.monospace')}
				class="{iconBtn} {monospace ? 'bg-[#00ADD8]/10 text-[#00ADD8] dark:bg-[#00ADD8]/15' : ''}"
			>
				<Type class="h-4 w-4" aria-hidden="true" />
				<span class="hidden sm:inline">{$t('tools.micron_editor.monospace')}</span>
			</button>
			<button
				type="button"
				onclick={toggleFullscreen}
				aria-label={fullscreen
					? $t('tools.micron_editor.exit_fullscreen')
					: $t('tools.micron_editor.fullscreen')}
				title={fullscreen
					? $t('tools.micron_editor.exit_fullscreen')
					: $t('tools.micron_editor.fullscreen')}
				class={iconBtn}
			>
				{#if fullscreen}
					<Minimize2 class="h-4 w-4" aria-hidden="true" />
				{:else}
					<Maximize2 class="h-4 w-4" aria-hidden="true" />
				{/if}
				<span class="hidden sm:inline"
					>{fullscreen
						? $t('tools.micron_editor.exit_fullscreen')
						: $t('tools.micron_editor.fullscreen')}</span
				>
			</button>

			{#if !popout}
				<button
					type="button"
					onclick={popOutEditor}
					aria-label={$t('tools.micron_editor.popout')}
					title={$t('tools.micron_editor.popout')}
					class={iconBtn}
				>
					<AppWindow class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.popout')}</span>
				</button>
			{/if}

			{#if loadStatus === 'error'}
				<div class="mx-0.5 h-5 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></div>
				<button
					type="button"
					onclick={retryLoad}
					aria-label={$t('tools.micron_editor.retry')}
					title={$t('tools.micron_editor.retry')}
					class="{iconBtn} text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
				>
					<RefreshCw class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.retry')}</span>
				</button>
			{/if}
		</div>

		<div
			class="flex min-w-0 items-center gap-0.5 overflow-x-auto border-b border-zinc-200 bg-white px-2 dark:border-zinc-800 dark:bg-zinc-900"
			role="tablist"
			aria-label={$t('tools.micron_editor.new_tab')}
		>
			{#each tabs as tab (tab.id)}
				<div
					class="group flex min-w-0 shrink-0 items-center border-b-2 {activeTabId === tab.id
						? 'border-[#00ADD8]'
						: 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'}"
					role="presentation"
				>
					{#if renamingTabId === tab.id}
						<input
							bind:this={renameInputEl}
							bind:value={renameValue}
							type="text"
							class="min-w-[5rem] max-w-[10rem] rounded-md bg-transparent px-2 py-1.5 text-sm outline-none ring-2 ring-[#00ADD8]/40"
							aria-label={$t('tools.micron_editor.rename_tab')}
							onkeydown={handleRenameKeydown}
							onblur={commitRename}
						/>
					{:else}
						<button
							type="button"
							role="tab"
							aria-selected={activeTabId === tab.id}
							aria-label="{tab.name}.mu"
							class="min-w-0 max-w-[9rem] truncate rounded-t-md px-2.5 py-1.5 text-sm font-medium transition-colors {activeTabId ===
							tab.id
								? 'text-[#00ADD8]'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
							onclick={() => handleTabClick(tab)}
							ondblclick={() => startRename(tab)}
						>
							{tab.name}
						</button>
					{/if}
					{#if tabs.length > 1}
						<button
							type="button"
							onclick={(event) => closeTab(tab.id, event)}
							aria-label="{$t('tools.micron_editor.close_tab')}: {tab.name}"
							class="mr-1 rounded p-0.5 text-zinc-400 opacity-100 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 md:opacity-0 md:group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 {activeTabId ===
							tab.id
								? 'md:opacity-100'
								: ''}"
						>
							<X class="h-3.5 w-3.5" aria-hidden="true" />
						</button>
					{/if}
				</div>
			{/each}

			<button
				type="button"
				onclick={addTab}
				aria-label={$t('tools.micron_editor.add_tab')}
				title={$t('tools.micron_editor.add_tab')}
				class="ml-0.5 inline-flex shrink-0 items-center rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-[#00ADD8] dark:hover:bg-zinc-800 dark:hover:text-[#00ADD8]"
			>
				<Plus class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>

		<div
			class="flex min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-950/60"
		>
			<button
				type="button"
				onclick={() => (snippetsOpen = !snippetsOpen)}
				aria-expanded={snippetsOpen}
				class="{toggleChipBtn} {snippetsOpen ? 'bg-[#00ADD8]/10 text-[#00ADD8]' : ''}"
			>
				<Braces class="h-3.5 w-3.5" aria-hidden="true" />
				<span>{$t('tools.micron_editor.snippets')}</span>
				<ChevronDown
					class="h-3 w-3 transition-transform {snippetsOpen ? 'rotate-180' : ''}"
					aria-hidden="true"
				/>
			</button>

			<div class="mx-0.5 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" aria-hidden="true"></div>

			<button
				type="button"
				onclick={() => (cheatsheetOpen = !cheatsheetOpen)}
				aria-expanded={cheatsheetOpen}
				aria-label={$t('tools.micron_editor.cheatsheet')}
				class="{toggleChipBtn} {cheatsheetOpen ? 'bg-[#00ADD8]/10 text-[#00ADD8]' : ''}"
			>
				<BookOpen class="h-3.5 w-3.5" aria-hidden="true" />
				<span>{$t('tools.micron_editor.cheatsheet')}</span>
				<ChevronDown
					class="h-3 w-3 transition-transform {cheatsheetOpen ? 'rotate-180' : ''}"
					aria-hidden="true"
				/>
			</button>
		</div>

		{#if snippetsOpen}
			<div
				class="flex min-w-0 flex-nowrap gap-1.5 overflow-x-auto border-b border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900"
			>
				{#each MICRON_SNIPPETS as snippet (snippet.id)}
					<button
						type="button"
						onclick={() => insertSnippet(snippet.insert)}
						title={snippet.hint}
						aria-label="{$t('tools.micron_editor.insert_snippet')}: {snippet.label}"
						class="shrink-0 whitespace-nowrap rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-400"
					>
						{snippet.label}
					</button>
				{/each}
			</div>
		{/if}

		{#if cheatsheetOpen}
			<div
				class="grid gap-1.5 border-b border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 sm:grid-cols-2 lg:grid-cols-3"
			>
				<div>
					<code class="font-mono text-[#00ADD8]">&gt;</code> /
					<code class="font-mono text-[#00ADD8]">&gt;&gt;</code> headings
				</div>
				<div><code class="font-mono">`!bold!`</code> emphasis</div>
				<div><code class="font-mono">`*italic*`</code> emphasis</div>
				<div><code class="font-mono">`[label`url]</code> links</div>
				<div><code class="font-mono">`Faaa`B333</code> colors</div>
				<div><code class="font-mono">-</code> divider on its own line</div>
			</div>
		{/if}

		<div class="grid min-h-0 min-w-0 flex-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
			<div
				class="flex min-h-0 min-w-0 flex-col border-b border-zinc-200 dark:border-zinc-800 md:border-b-0 md:border-r"
			>
				<div
					class="shrink-0 border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
				>
					{$t('tools.micron_editor.source')}
				</div>
				<div class="relative min-h-0 min-w-0 flex-1" bind:this={sourcePaneEl}>
					<textarea
						bind:this={textareaEl}
						bind:value={source}
						spellcheck="false"
						wrap="off"
						onscroll={syncScroll}
						onmousemove={onSourceMouseMove}
						onmouseleave={onSourceMouseLeave}
						class="absolute inset-0 h-full w-full resize-none overflow-auto bg-zinc-100 p-3 font-mono text-sm leading-relaxed text-zinc-900 outline-none ring-inset focus:ring-2 focus:ring-[#00ADD8]/30 dark:bg-zinc-950 dark:text-zinc-100 sm:p-4"
						aria-label={$t('tools.micron_editor.source')}></textarea>
					{#if hoveredColor}
						<div
							class="absolute z-20 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
							style={colorPopoverStyle(hoveredColor)}
							role="group"
							tabindex="-1"
							aria-label={$t('tools.micron_editor.colors')}
							onmouseenter={pinColorPopover}
							onmouseleave={unpinColorPopover}
						>
							<span
								class="font-mono text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-200"
							>
								`{hoveredColor.kind}{hoveredColor.hex3}
							</span>
							<label
								class="relative inline-flex h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-600"
								title="{$t('tools.micron_editor.colors')}: {hoveredColor.kind}{hoveredColor.hex3}"
							>
								<span
									class="pointer-events-none absolute inset-0"
									style="background: {micronToHex6(hoveredColor.hex3)}"
									aria-hidden="true"
								></span>
								<input
									type="color"
									value={micronToHex6(hoveredColor.hex3)}
									class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
									aria-label="{hoveredColor.kind} color {hoveredColor.hex3}"
									oninput={(event) => changeColor(hoveredColor!, event)}
									onchange={finishColorDrag}
									onfocus={pinColorPopover}
								/>
							</label>
						</div>
					{/if}
				</div>
			</div>

			<div class="flex min-h-0 min-w-0 flex-col overflow-hidden">
				<div
					class="shrink-0 border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
				>
					{$t('tools.micron_editor.preview')}
				</div>
				<div
					id="micron-preview"
					class="min-h-0 min-w-0 flex-1 overflow-auto bg-white p-3 text-sm leading-relaxed text-zinc-900 dark:bg-black dark:text-zinc-100 sm:p-4 {monospace
						? 'font-mono'
						: ''}"
				>
					{#if loadStatus === 'loading'}
						<p class="text-sm text-zinc-500 dark:text-zinc-400">
							{$t('tools.micron_editor.loading')}
						</p>
					{:else if loadStatus === 'error'}
						<p class="text-sm text-red-600 dark:text-red-400">
							{$t('tools.micron_editor.error')}
							{#if loadError}
								<span class="mt-1 block font-mono text-xs opacity-90">{loadError}</span>
							{/if}
						</p>
					{:else}
						{@html previewHtml}
					{/if}
				</div>
			</div>
		</div>

		<div
			class="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-800 dark:bg-zinc-950/60"
		>
			<div class="min-w-0">
				{#if loadStatus === 'loading'}
					<span class="text-amber-600 dark:text-amber-400">{$t('tools.micron_editor.loading')}</span
					>
				{:else if loadStatus === 'error'}
					<span class="text-red-600 dark:text-red-400" title={loadError || undefined}>
						{$t('tools.micron_editor.error')}
						{#if loadError}
							<span class="ml-1 font-mono opacity-80">({loadError})</span>
						{/if}
					</span>
				{/if}
			</div>
			<div class="flex shrink-0 gap-3 tabular-nums text-zinc-500 dark:text-zinc-400">
				<span>{$t('tools.micron_editor.lines')}: {lineCount}</span>
				<span>{$t('tools.micron_editor.chars')}: {charCount}</span>
			</div>
		</div>
	</div>
</div>
