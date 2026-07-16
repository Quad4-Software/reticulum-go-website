<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import TutorialPlayer from '$lib/components/tutorials/TutorialPlayer.svelte';
	import { listTutorials } from '$lib/tutorials';

	let { data } = $props();

	const chapters = listTutorials();
</script>

<svelte:head>
	<title>{data.tutorial.title} | {$t('tools.reticulum_guide.page_title')} | Reticulum-Go</title>
	<meta name="description" content={data.tutorial.summary} />
</svelte:head>

<div class="space-y-8">
	<div class="space-y-4">
		<a
			href="/tools/reticulum-guide"
			class="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#00ADD8] transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{$t('tools.reticulum_guide.back_guide')}</span>
		</a>

		<div class="min-w-0 space-y-2">
			<h1 class="break-words text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
				{data.tutorial.title}
			</h1>
			<p class="max-w-3xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
				{data.tutorial.summary}
			</p>
		</div>
	</div>

	{#key data.tutorial.slug}
		<TutorialPlayer tutorial={data.tutorial} {chapters} />
	{/key}
</div>
