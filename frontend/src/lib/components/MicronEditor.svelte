<script lang="ts">
	import {
		Check,
		ChevronDown,
		Code2,
		Copy,
		Download,
		Eye,
		Maximize2,
		Minimize2,
		Plus,
		Redo2,
		RefreshCw,
		RotateCcw,
		Trash2,
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
		micronToHex6,
		hex6ToMicron,
		replaceMicronColorAt,
		type MicronColorMatch
	} from '$lib/micron-colors';

	type LoadStatus = 'loading' | 'ready' | 'error';
	type MobileTab = 'source' | 'preview';

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
	let mobileTab = $state<MobileTab>('source');
	let copied = $state(false);
	let darkTheme = $state(true);
	let cheatsheetOpen = $state(false);
	let retryNonce = $state(0);
	let fullscreen = $state(false);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);
	let rootEl = $state<HTMLElement | null>(null);

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

	const COLOR_SQUARE = 14;

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
		const match = font.match(/(\d+(?:\.\d+)?)px/);
		const fontSize = match ? parseFloat(match[1]) : 14;
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
	}

	function colorSquareStyle(match: MicronColorMatch): string {
		const m = overlayMetrics;
		const top =
			m.paddingTop + match.line * m.lineHeight - m.scrollTop + (m.lineHeight - COLOR_SQUARE) / 2;
		const left = m.paddingLeft + match.column * m.charWidth - m.scrollLeft - COLOR_SQUARE - 2;
		return `top: ${top}px; left: ${left}px; width: ${COLOR_SQUARE}px; height: ${COLOR_SQUARE}px`;
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

	const toolbarBtn =
		'inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-200 disabled:hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-300';

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
		if (!fullscreen) return;
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

<div class="min-w-0">
	<div
		bind:this={rootEl}
		class="flex min-w-0 flex-col overflow-hidden border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 {fullscreen
			? 'fixed inset-0 z-50 h-dvh rounded-none'
			: 'rounded-xl'}"
	>
		<div
			class="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50 sm:gap-3 sm:px-3"
		>
			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onclick={undo}
					disabled={!canUndo}
					aria-label={$t('tools.micron_editor.undo')}
					class={toolbarBtn}
				>
					<Undo2 class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.undo')}</span>
				</button>

				<button
					type="button"
					onclick={redo}
					disabled={!canRedo}
					aria-label={$t('tools.micron_editor.redo')}
					class={toolbarBtn}
				>
					<Redo2 class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.redo')}</span>
				</button>
			</div>

			<div class="hidden h-6 w-px bg-zinc-200 dark:bg-zinc-700 sm:block" aria-hidden="true"></div>

			<button
				type="button"
				onclick={resetSample}
				aria-label={$t('tools.micron_editor.reset')}
				class={toolbarBtn}
			>
				<RotateCcw class="h-4 w-4" aria-hidden="true" />
				<span>{$t('tools.micron_editor.reset')}</span>
			</button>

			<button
				type="button"
				onclick={clearSource}
				aria-label={$t('tools.micron_editor.clear')}
				class={toolbarBtn}
			>
				<Trash2 class="h-4 w-4" aria-hidden="true" />
				<span>{$t('tools.micron_editor.clear')}</span>
			</button>

			<button
				type="button"
				onclick={copySource}
				aria-label={copied ? $t('tools.micron_editor.copied') : $t('tools.micron_editor.copy')}
				class={toolbarBtn}
			>
				{#if copied}
					<Check class="h-4 w-4 text-[#00ADD8]" aria-hidden="true" />
					<span>{$t('tools.micron_editor.copied')}</span>
				{:else}
					<Copy class="h-4 w-4" aria-hidden="true" />
					<span>{$t('tools.micron_editor.copy')}</span>
				{/if}
			</button>

			<button
				type="button"
				onclick={downloadMu}
				aria-label={$t('tools.micron_editor.download')}
				class={toolbarBtn}
			>
				<Download class="h-4 w-4" aria-hidden="true" />
				<span>{$t('tools.micron_editor.download')}</span>
			</button>

			<label
				class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] has-[:checked]:border-[#00ADD8] has-[:checked]:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-300"
			>
				<input
					type="checkbox"
					bind:checked={monospace}
					aria-label={$t('tools.micron_editor.monospace')}
					class="rounded border-zinc-300 text-[#00ADD8] focus:ring-[#00ADD8] dark:border-zinc-600"
				/>
				<span>{$t('tools.micron_editor.monospace')}</span>
			</label>

			<button
				type="button"
				onclick={toggleFullscreen}
				aria-label={fullscreen
					? $t('tools.micron_editor.exit_fullscreen')
					: $t('tools.micron_editor.fullscreen')}
				class={toolbarBtn}
			>
				{#if fullscreen}
					<Minimize2 class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.exit_fullscreen')}</span>
				{:else}
					<Maximize2 class="h-4 w-4" aria-hidden="true" />
					<span class="hidden sm:inline">{$t('tools.micron_editor.fullscreen')}</span>
				{/if}
			</button>

			{#if loadStatus === 'error'}
				<button
					type="button"
					onclick={retryLoad}
					aria-label={$t('tools.micron_editor.retry')}
					class="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-red-800 dark:text-red-400"
				>
					<RefreshCw class="h-4 w-4" aria-hidden="true" />
					<span>{$t('tools.micron_editor.retry')}</span>
				</button>
			{/if}
		</div>

		<div
			class="flex min-w-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-2 py-1 dark:border-zinc-800 dark:bg-zinc-950/50 sm:px-3"
			role="tablist"
			aria-label={$t('tools.micron_editor.new_tab')}
		>
			{#each tabs as tab (tab.id)}
				<div
					class="group flex min-w-0 shrink-0 items-center rounded-lg border text-sm transition-colors {activeTabId ===
					tab.id
						? 'border-[#00ADD8] bg-white text-[#00ADD8] dark:bg-zinc-900'
						: 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-white dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900'}"
					role="presentation"
				>
					{#if renamingTabId === tab.id}
						<input
							bind:this={renameInputEl}
							bind:value={renameValue}
							type="text"
							class="min-w-[5rem] max-w-[10rem] rounded-lg bg-transparent px-2 py-1 text-sm outline-none ring-2 ring-[#00ADD8]/40"
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
							class="min-w-0 max-w-[10rem] truncate px-2.5 py-1 font-medium"
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
							class="mr-1 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-zinc-700 group-hover:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 {activeTabId ===
							tab.id
								? 'opacity-100'
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
				class="inline-flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2 py-1 text-sm text-zinc-500 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-600 dark:text-zinc-400"
			>
				<Plus class="h-4 w-4" aria-hidden="true" />
			</button>
		</div>

		<div
			class="flex min-w-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/50 sm:px-3"
		>
			<span
				class="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
			>
				{$t('tools.micron_editor.snippets')}
			</span>
			{#each MICRON_SNIPPETS as snippet (snippet.id)}
				<button
					type="button"
					onclick={() => insertSnippet(snippet.insert)}
					title={snippet.hint}
					aria-label="{$t('tools.micron_editor.insert_snippet')}: {snippet.label}"
					class="shrink-0 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-400"
				>
					{snippet.label}
				</button>
			{/each}
		</div>

		<div class="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
			<button
				type="button"
				onclick={() => (cheatsheetOpen = !cheatsheetOpen)}
				aria-expanded={cheatsheetOpen}
				aria-label={$t('tools.micron_editor.cheatsheet')}
				class="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:text-[#00ADD8] dark:text-zinc-300 sm:px-3"
			>
				<span>{$t('tools.micron_editor.cheatsheet')}</span>
				<ChevronDown
					class="h-4 w-4 shrink-0 transition-transform {cheatsheetOpen ? 'rotate-180' : ''}"
					aria-hidden="true"
				/>
			</button>
			{#if cheatsheetOpen}
				<div
					class="grid gap-2 border-t border-zinc-200 px-3 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 sm:grid-cols-2 sm:px-4 lg:grid-cols-3"
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
		</div>

		<div class="flex min-w-0 border-b border-zinc-200 dark:border-zinc-800 md:hidden">
			<button
				type="button"
				onclick={() => (mobileTab = 'source')}
				aria-label={$t('tools.micron_editor.source')}
				aria-pressed={mobileTab === 'source'}
				class="flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors {mobileTab ===
				'source'
					? 'border-b-2 border-[#00ADD8] bg-zinc-50 text-[#00ADD8] dark:bg-zinc-950/50'
					: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
			>
				<Code2 class="h-4 w-4 shrink-0" aria-hidden="true" />
				<span class="truncate">{$t('tools.micron_editor.source')}</span>
			</button>
			<button
				type="button"
				onclick={() => (mobileTab = 'preview')}
				aria-label={$t('tools.micron_editor.preview')}
				aria-pressed={mobileTab === 'preview'}
				class="flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors {mobileTab ===
				'preview'
					? 'border-b-2 border-[#00ADD8] bg-zinc-50 text-[#00ADD8] dark:bg-zinc-950/50'
					: 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}"
			>
				<Eye class="h-4 w-4 shrink-0" aria-hidden="true" />
				<span class="truncate">{$t('tools.micron_editor.preview')}</span>
			</button>
		</div>

		<div
			class="grid min-h-0 min-w-0 flex-1 md:grid-cols-2 {fullscreen
				? 'min-h-0'
				: 'h-[min(85vh,960px)] min-h-[32rem]'}"
		>
			<div
				class="flex min-w-0 flex-col border-b border-zinc-200 dark:border-zinc-800 md:border-b-0 md:border-r {mobileTab !==
				'source'
					? 'hidden md:flex'
					: 'flex'}"
			>
				<div
					class="hidden border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 md:block"
				>
					{$t('tools.micron_editor.source')}
				</div>
				<div class="relative min-h-0 min-w-0 flex-1">
					<textarea
						bind:this={textareaEl}
						bind:value={source}
						spellcheck="false"
						onscroll={syncScroll}
						class="absolute inset-0 h-full w-full resize-none overflow-auto bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-900 outline-none ring-inset focus:ring-2 focus:ring-[#00ADD8]/30 dark:bg-zinc-950 dark:text-zinc-100"
						aria-label={$t('tools.micron_editor.source')}></textarea>
					<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="false">
						{#each colorMatches as match, index (`${match.index}-${match.kind}-${index}`)}
							<label
								class="pointer-events-auto absolute z-10 cursor-pointer"
								style={colorSquareStyle(match)}
							>
								<input
									type="color"
									value={micronToHex6(match.hex3)}
									class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
									aria-label="{match.kind} color {match.hex3}"
									oninput={(event) => changeColor(match, event)}
									onchange={finishColorDrag}
								/>
								<span
									class="block h-3.5 w-3.5 rounded-sm border border-zinc-300 dark:border-zinc-600"
									style="background: {micronToHex6(match.hex3)}"
									title="{match.kind}{match.hex3}"
								></span>
							</label>
						{/each}
					</div>
				</div>
			</div>

			<div
				class="flex min-w-0 flex-col overflow-hidden {mobileTab !== 'preview'
					? 'hidden md:flex'
					: 'flex'}"
			>
				<div
					class="hidden border-b border-zinc-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 md:block"
				>
					{$t('tools.micron_editor.preview')}
				</div>
				<div
					id="micron-preview"
					class="min-h-0 min-w-0 flex-1 overflow-auto bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-900 dark:bg-black dark:text-zinc-100 {monospace
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
			class="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400"
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
			<div class="flex shrink-0 gap-3 tabular-nums">
				<span>{$t('tools.micron_editor.lines')}: {lineCount}</span>
				<span>{$t('tools.micron_editor.chars')}: {charCount}</span>
			</div>
		</div>
	</div>
</div>
