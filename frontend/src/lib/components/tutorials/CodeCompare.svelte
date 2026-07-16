<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { TutorialCodePair, TutorialLang } from '$lib/tutorials/types';
	import { highlightCode } from '$lib/code-highlight';

	const STORAGE_KEY = 'reticulum-guide-lang';

	let {
		code,
		lang = 'python'
	}: {
		code: TutorialCodePair;
		lang?: TutorialLang;
	} = $props();

	function readStoredLang(): TutorialLang {
		if (typeof localStorage?.getItem !== 'function') return lang;
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === 'python' || stored === 'go' ? stored : lang;
	}

	let activeLang = $state<TutorialLang>(readStoredLang());
	let copied = $state(false);
	let highlightedHtml = $state('');
	let highlightError = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	const source = $derived(activeLang === 'python' ? code.python : code.go);

	function selectLang(next: TutorialLang) {
		activeLang = next;
		if (typeof localStorage?.setItem === 'function') {
			localStorage.setItem(STORAGE_KEY, next);
		}
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
			copied = false;
		}
	}

	$effect(() => {
		const langId = activeLang;
		const text = source;
		let cancelled = false;
		highlightError = false;
		highlightedHtml = '';
		void highlightCode(text, langId)
			.then((html) => {
				if (!cancelled) highlightedHtml = html;
			})
			.catch(() => {
				if (!cancelled) highlightError = true;
			});
		return () => {
			cancelled = true;
		};
	});
</script>

<div
	class="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50"
>
	<div
		class="flex flex-col gap-3 border-b border-zinc-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:border-zinc-800"
	>
		<div class="min-w-0">
			<p class="text-sm font-medium text-zinc-600 dark:text-zinc-400">{code.caption}</p>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<div
				class="flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
				role="group"
				aria-label={$t('tools.reticulum_guide.code_sample')}
			>
				<button
					type="button"
					class="rounded-md px-3 py-1 text-xs font-semibold transition-colors {activeLang ===
					'python'
						? 'bg-[#00ADD8] text-white'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					aria-pressed={activeLang === 'python'}
					onclick={() => selectLang('python')}
				>
					{$t('tools.reticulum_guide.python')}
				</button>
				<button
					type="button"
					class="rounded-md px-3 py-1 text-xs font-semibold transition-colors {activeLang === 'go'
						? 'bg-[#00ADD8] text-white'
						: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'}"
					aria-pressed={activeLang === 'go'}
					onclick={() => selectLang('go')}
				>
					{$t('tools.reticulum_guide.go')}
				</button>
			</div>
			<button
				type="button"
				class="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
				aria-label={$t('tools.reticulum_guide.copy')}
				onclick={copySource}
			>
				{#if copied}
					<Check class="h-4 w-4" />
				{:else}
					<Copy class="h-4 w-4" />
				{/if}
			</button>
		</div>
	</div>
	{#if highlightedHtml && !highlightError}
		<div class="tutorial-code overflow-x-auto p-4 text-sm leading-relaxed">
			{@html highlightedHtml}
		</div>
	{:else}
		<pre class="overflow-x-auto p-4 text-sm leading-relaxed"><code
				class="font-mono text-zinc-800 dark:text-zinc-200">{source}</code
			></pre>
	{/if}
</div>

<style>
	.tutorial-code :global(pre.shiki) {
		margin: 0;
		padding: 0;
		background: transparent !important;
		overflow: visible;
	}
	.tutorial-code :global(pre.shiki code) {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875rem;
		line-height: 1.625;
	}
	.tutorial-code :global(pre.shiki span) {
		color: var(--shiki-light);
	}
	:global(.dark) .tutorial-code :global(pre.shiki span) {
		color: var(--shiki-dark) !important;
	}
</style>
