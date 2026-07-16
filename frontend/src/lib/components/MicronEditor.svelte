<script lang="ts">
	import {
		Check,
		ChevronDown,
		Code2,
		Copy,
		Download,
		Eye,
		RefreshCw,
		RotateCcw,
		Trash2
	} from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { ensureMicronParser, convertMicron, clearMicronParserLoad } from '$lib/micron-parser';
	import {
		DEFAULT_MICRON_SAMPLE,
		loadMicronEditorState,
		saveMicronEditorState,
		MICRON_SNIPPETS,
		insertAtCursor
	} from '$lib/micron-editor-state';

	type LoadStatus = 'loading' | 'ready' | 'error';
	type MobileTab = 'source' | 'preview';

	const saved = loadMicronEditorState();

	let source = $state(saved.source);
	let monospace = $state(saved.monospace);
	let loadStatus = $state<LoadStatus>('loading');
	let loadError = $state('');
	let previewHtml = $state('');
	let mobileTab = $state<MobileTab>('source');
	let copied = $state(false);
	let darkTheme = $state(true);
	let cheatsheetOpen = $state(false);
	let retryNonce = $state(0);
	let textareaEl = $state<HTMLTextAreaElement | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let rafId: number | undefined;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const lineCount = $derived(source.split('\n').length);
	const charCount = $derived(source.length);

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
			saveMicronEditorState({ source, monospace });
		}, 300);
	}

	function resetSample() {
		source = DEFAULT_MICRON_SAMPLE;
	}

	function clearSource() {
		source = '';
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
		const blob = new Blob([source], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = 'document.mu';
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function retryLoad() {
		clearMicronParserLoad();
		retryNonce += 1;
	}

	function insertSnippet(insert: string) {
		const el = textareaEl;
		if (!el) return;
		const cursor = el.selectionStart ?? source.length;
		const result = insertAtCursor(source, cursor, insert);
		source = result.source;
		queueMicrotask(() => {
			el.focus();
			el.setSelectionRange(result.cursor, result.cursor);
		});
	}

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
		void source;
		void monospace;
		scheduleSave();
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});
</script>

<div
	class="flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
>
	<div
		class="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50 sm:gap-3 sm:px-4"
	>
		<button
			type="button"
			onclick={resetSample}
			aria-label={$t('tools.micron_editor.reset')}
			class="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-300"
		>
			<RotateCcw class="h-4 w-4" aria-hidden="true" />
			<span>{$t('tools.micron_editor.reset')}</span>
		</button>

		<button
			type="button"
			onclick={clearSource}
			aria-label={$t('tools.micron_editor.clear')}
			class="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-300"
		>
			<Trash2 class="h-4 w-4" aria-hidden="true" />
			<span>{$t('tools.micron_editor.clear')}</span>
		</button>

		<button
			type="button"
			onclick={copySource}
			aria-label={copied ? $t('tools.micron_editor.copied') : $t('tools.micron_editor.copy')}
			class="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-300"
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
			class="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-700 dark:text-zinc-300"
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
		class="flex min-w-0 flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950/50 sm:px-4"
	>
		<span class="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
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
			class="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:text-[#00ADD8] dark:text-zinc-300 sm:px-4"
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
				<div><code class="font-mono text-[#00ADD8]">&gt;</code> / <code class="font-mono text-[#00ADD8]">&gt;&gt;</code> headings</div>
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

	<div class="grid min-h-[60vh] min-w-0 h-[min(70vh,720px)] md:grid-cols-2">
		<div
			class="flex min-w-0 flex-col border-b border-zinc-200 dark:border-zinc-800 md:border-b-0 md:border-r {mobileTab !==
			'source'
				? 'hidden md:flex'
				: 'flex'}"
		>
			<div
				class="hidden border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 md:block"
			>
				{$t('tools.micron_editor.source')}
			</div>
			<textarea
				bind:this={textareaEl}
				bind:value={source}
				spellcheck="false"
				class="min-h-0 min-w-0 flex-1 resize-none bg-zinc-50 p-4 font-mono text-sm leading-relaxed text-zinc-900 outline-none focus:ring-2 ring-inset ring-[#00ADD8]/30 dark:bg-zinc-950 dark:text-zinc-100"
				aria-label={$t('tools.micron_editor.source')}
			></textarea>
		</div>

		<div
			class="flex min-w-0 flex-col overflow-hidden {mobileTab !== 'preview' ? 'hidden md:flex' : 'flex'}"
		>
			<div
				class="hidden border-b border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 md:block"
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
		class="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400"
	>
		<div class="min-w-0">
			{#if loadStatus === 'loading'}
				<span class="text-amber-600 dark:text-amber-400">{$t('tools.micron_editor.loading')}</span>
			{:else if loadStatus === 'error'}
				<span class="text-red-600 dark:text-red-400" title={loadError || undefined}>
					{$t('tools.micron_editor.error')}
					{#if loadError}
						<span class="ml-1 font-mono opacity-80">({loadError})</span>
					{/if}
				</span>
			{:else}
				<span class="text-[#00ADD8]">{$t('tools.micron_editor.ready')}</span>
			{/if}
		</div>
		<div class="flex shrink-0 gap-3 tabular-nums">
			<span>{$t('tools.micron_editor.lines')}: {lineCount}</span>
			<span>{$t('tools.micron_editor.chars')}: {charCount}</span>
		</div>
	</div>
</div>
