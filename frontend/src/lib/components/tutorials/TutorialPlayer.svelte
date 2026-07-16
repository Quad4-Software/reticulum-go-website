<script lang="ts">
	import { ChevronLeft, ChevronRight, BookOpen, Quote } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { Tutorial, TutorialCatalogEntry } from '$lib/tutorials/types';
	import { listTutorials } from '$lib/tutorials';
	import TutorialVisual from './TutorialVisual.svelte';
	import ChapterSidebar from './ChapterSidebar.svelte';
	import CodeCompare from './CodeCompare.svelte';
	import TutorialInteractive from './TutorialInteractive.svelte';

	let {
		tutorial,
		chapters = listTutorials()
	}: {
		tutorial: Tutorial;
		chapters?: TutorialCatalogEntry[];
	} = $props();

	let stepIndex = $state(0);
	let touchStartX = $state(0);
	let touchStartY = $state(0);

	const currentStep = $derived(tutorial.steps[stepIndex]);
	const totalSteps = $derived(tutorial.steps.length);
	const isFirst = $derived(stepIndex === 0);
	const isLast = $derived(stepIndex === totalSteps - 1);

	function goPrevious() {
		if (!isFirst) stepIndex -= 1;
	}

	function goNext() {
		if (!isLast) stepIndex += 1;
	}

	function goToStep(index: number) {
		if (index >= 0 && index < totalSteps) stepIndex = index;
	}

	function isTypingTarget(target: EventTarget | null) {
		if (!(target instanceof HTMLElement)) return false;
		return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
	}

	function onKeydown(event: KeyboardEvent) {
		if (isTypingTarget(event.target)) return;
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goNext();
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goPrevious();
		}
	}

	function onTouchStart(event: TouchEvent) {
		const touch = event.changedTouches[0];
		if (!touch) return;
		touchStartX = touch.clientX;
		touchStartY = touch.clientY;
	}

	function onTouchEnd(event: TouchEvent) {
		const touch = event.changedTouches[0];
		if (!touch) return;
		const dx = touch.clientX - touchStartX;
		const dy = touch.clientY - touchStartY;
		if (Math.abs(dx) < 56 || Math.abs(dy) > Math.abs(dx)) return;
		if (dx < 0) goNext();
		else goPrevious();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div
	class="grid min-w-0 gap-6 md:grid-cols-[240px_minmax(0,1fr)] md:items-start lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8"
>
	<ChapterSidebar {chapters} currentSlug={tutorial.slug} />

	<article
		class="min-w-0 space-y-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:space-y-8 md:pb-0"
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
	>
		<div class="grid min-w-0 gap-6 md:grid-cols-2 md:items-start md:gap-8">
			<div class="order-2 min-w-0 space-y-6 md:order-1">
				<div class="space-y-3">
					<h2 class="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-100">
						{currentStep.title}
					</h2>
					<p class="leading-relaxed text-zinc-600 dark:text-zinc-400">{currentStep.body}</p>
				</div>

				{#if currentStep.points.length > 0}
					<ul class="space-y-2">
						{#each currentStep.points as point, index (index)}
							<li class="flex gap-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
								<span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00ADD8]" aria-hidden="true"
								></span>
								<span class="min-w-0">{point}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="order-1 min-w-0 md:sticky md:top-24 md:order-2">
				<TutorialVisual visual={currentStep.visual} {stepIndex} />
			</div>
		</div>

		{#if currentStep.code}
			<div class="min-w-0">
				<CodeCompare code={currentStep.code} />
			</div>
		{/if}

		{#if currentStep.interactive}
			<div class="min-w-0">
				<TutorialInteractive kind={currentStep.interactive} tryIt={currentStep.tryIt} />
			</div>
		{:else if currentStep.tryIt}
			<p
				class="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
			>
				<span class="shrink-0 font-semibold text-[#00ADD8]"
					>{$t('tools.reticulum_guide.try_it')}:</span
				>
				<span class="min-w-0">{currentStep.tryIt}</span>
			</p>
		{/if}

		<div
			class="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 md:static md:inset-auto md:z-10 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none"
		>
			<div
				class="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex items-center justify-between gap-3 sm:justify-start">
					<p class="text-sm font-medium text-zinc-500 dark:text-zinc-400">
						{$t('tools.reticulum_guide.step_of', {
							values: { current: stepIndex + 1, total: totalSteps }
						})}
					</p>
					<p class="hidden text-xs text-zinc-400 sm:block dark:text-zinc-500">
						{$t('tools.reticulum_guide.nav_hint')}
					</p>
				</div>

				<div
					class="flex items-center justify-center gap-2"
					role="tablist"
					aria-label="Tutorial steps"
				>
					{#each tutorial.steps as step, index (step.id)}
						<button
							type="button"
							role="tab"
							aria-selected={index === stepIndex}
							aria-label={step.title}
							class="h-2.5 w-2.5 rounded-full transition-all {index === stepIndex
								? 'scale-110 bg-[#00ADD8]'
								: 'bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700 dark:hover:bg-zinc-500'}"
							onclick={() => goToStep(index)}
						></button>
					{/each}
				</div>

				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:gap-2 sm:px-4 dark:border-zinc-800"
						disabled={isFirst}
						aria-label={$t('tools.reticulum_guide.previous')}
						onclick={goPrevious}
					>
						<ChevronLeft class="h-4 w-4 shrink-0" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#00ADD8] px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:gap-2 sm:px-4"
						disabled={isLast}
						aria-label={$t('tools.reticulum_guide.next')}
						onclick={goNext}
					>
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4 shrink-0" />
					</button>
				</div>
			</div>
		</div>

		<footer class="space-y-6 border-t border-zinc-200 pt-8 dark:border-zinc-800">
			<div class="space-y-3">
				<h3
					class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
				>
					<BookOpen class="h-4 w-4" />
					<span>{$t('tools.reticulum_guide.sources')}</span>
				</h3>
				<ul class="space-y-2">
					{#each tutorial.sources as source (source.id)}
						<li>
							<a
								href={source.href}
								target="_blank"
								rel="noopener noreferrer"
								class="break-words text-sm font-medium text-[#00ADD8] hover:underline"
							>
								{source.label}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p
					class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#00ADD8]"
				>
					<Quote class="h-4 w-4" />
					<span>{$t('tools.reticulum_guide.zen')}</span>
				</p>
				<p class="mt-2 text-sm italic text-zinc-600 dark:text-zinc-400">{tutorial.zenNote}</p>
			</div>
		</footer>
	</article>
</div>
