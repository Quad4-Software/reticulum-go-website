<script lang="ts">
	import { ChevronDown, ChevronRight, BookOpen } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { TutorialCatalogEntry } from '$lib/tutorials/types';

	let {
		chapters,
		currentSlug
	}: {
		chapters: TutorialCatalogEntry[];
		currentSlug: string;
	} = $props();

	let mobileOpen = $state(false);

	const currentChapter = $derived(chapters.find((chapter) => chapter.slug === currentSlug));

	function toggleMobile() {
		mobileOpen = !mobileOpen;
	}
</script>

<nav
	class="min-w-0 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:sticky md:top-24"
	aria-label={$t('tools.reticulum_guide.chapters')}
>
	<button
		type="button"
		class="flex w-full items-center justify-between gap-3 p-4 text-left md:cursor-default"
		aria-expanded={mobileOpen}
		aria-label={$t('tools.reticulum_guide.chapters_toggle')}
		onclick={toggleMobile}
	>
		<span class="min-w-0 space-y-1">
			<span
				class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
			>
				<BookOpen class="h-4 w-4 shrink-0" />
				<span>{$t('tools.reticulum_guide.chapters')}</span>
			</span>
			{#if currentChapter}
				<span class="block truncate text-sm font-medium text-zinc-900 md:hidden dark:text-zinc-100">
					{currentChapter.title}
				</span>
			{/if}
		</span>
		<span class="shrink-0 text-zinc-400 md:hidden" aria-hidden="true">
			{#if mobileOpen}
				<ChevronDown class="h-4 w-4" />
			{:else}
				<ChevronRight class="h-4 w-4" />
			{/if}
		</span>
	</button>

	<ul class="space-y-1 px-2 pb-3 {mobileOpen ? 'block' : 'hidden'} md:block">
		{#each chapters as chapter (chapter.slug)}
			{@const isActive = chapter.slug === currentSlug}
			<li>
				<a
					href="/tools/reticulum-guide/{chapter.slug}"
					aria-current={isActive ? 'page' : undefined}
					class="block rounded-xl px-3 py-2 text-sm transition-colors {isActive
						? 'bg-[#00ADD8]/10 font-semibold text-[#00ADD8]'
						: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
				>
					{chapter.title}
				</a>
			</li>
		{/each}
	</ul>
</nav>
