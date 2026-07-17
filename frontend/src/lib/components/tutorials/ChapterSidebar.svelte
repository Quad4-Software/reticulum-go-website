<script lang="ts">
	import { BookOpen, Menu, X } from 'lucide-svelte';
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

	function openMobile() {
		mobileOpen = true;
	}

	function closeMobile() {
		mobileOpen = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (mobileOpen && event.key === 'Escape') closeMobile();
	}

	$effect(() => {
		void currentSlug;
		mobileOpen = false;
	});

	$effect(() => {
		if (!mobileOpen) return;
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	});
</script>

{#snippet chapterList()}
	<ul class="space-y-1 px-2 py-3">
		{#each chapters as chapter (chapter.slug)}
			{@const isActive = chapter.slug === currentSlug}
			<li>
				<a
					href="/tools/reticulum-guide/{chapter.slug}"
					aria-current={isActive ? 'page' : undefined}
					class="block rounded-xl px-3 py-2 text-sm transition-colors {isActive
						? 'bg-[#00ADD8]/10 font-semibold text-[#00ADD8]'
						: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}"
					onclick={closeMobile}
				>
					{chapter.title}
				</a>
			</li>
		{/each}
	</ul>
{/snippet}

<svelte:window onkeydown={onKeydown} />

<button
	type="button"
	class="flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900 md:hidden"
	aria-haspopup="dialog"
	aria-expanded={mobileOpen}
	aria-label={$t('tools.reticulum_guide.chapters_toggle')}
	onclick={openMobile}
>
	<span class="flex min-w-0 items-center gap-2">
		<BookOpen class="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
		<span class="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
			{currentChapter?.title ?? $t('tools.reticulum_guide.chapters')}
		</span>
	</span>
	<Menu class="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
</button>

<nav
	class="hidden min-w-0 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:sticky md:top-24 md:block"
	aria-label={$t('tools.reticulum_guide.chapters')}
>
	{@render chapterList()}
</nav>

{#if mobileOpen}
	<div
		class="fixed inset-0 z-50 md:hidden"
		role="dialog"
		aria-modal="true"
		aria-label={$t('tools.reticulum_guide.chapters')}
	>
		<button
			type="button"
			class="absolute inset-0 bg-black/50"
			aria-label={$t('tools.reticulum_guide.chapters_close')}
			onclick={closeMobile}
		></button>
		<div
			class="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-white shadow-xl dark:bg-zinc-950"
		>
			<div
				class="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
			>
				<span
					class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
				>
					<BookOpen class="h-4 w-4 shrink-0" />
					<span>{$t('tools.reticulum_guide.chapters')}</span>
				</span>
				<button
					type="button"
					class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
					aria-label={$t('tools.reticulum_guide.chapters_close')}
					onclick={closeMobile}
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto pb-[max(0.5rem,env(safe-area-inset-bottom))]">
				{@render chapterList()}
			</div>
		</div>
	</div>
{/if}
