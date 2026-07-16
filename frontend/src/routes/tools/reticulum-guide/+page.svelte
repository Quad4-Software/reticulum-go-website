<script lang="ts">
	import { ArrowLeft, ArrowRight, Search as SearchIcon } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { listTutorials } from '$lib/tutorials';

	const tutorials = listTutorials();

	let searchQuery = $state('');

	let filteredTutorials = $derived.by(() => {
		if (!searchQuery.trim()) return tutorials;
		const query = searchQuery.toLowerCase();
		return tutorials.filter((chapter) => {
			const haystack = [chapter.title, chapter.summary, ...chapter.tags].join(' ').toLowerCase();
			return haystack.includes(query);
		});
	});
</script>

<svelte:head>
	<title>{$t('tools.reticulum_guide.page_title')} | Reticulum-Go</title>
	<meta name="description" content={$t('tools.reticulum_guide.description')} />
</svelte:head>

<div class="space-y-8">
	<div class="space-y-4">
		<a
			href="/tools"
			class="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#00ADD8] transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{$t('tools.reticulum_guide.back')}</span>
		</a>

		<div class="space-y-3 text-center">
			<div class="flex items-center justify-center gap-3">
				<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
					{$t('tools.reticulum_guide.page_title')}
				</h1>
				<span class="px-2 py-1 text-[10px] font-semibold rounded uppercase bg-amber-500 text-white">
					{$t('common.alpha')}
				</span>
			</div>
			<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
				{$t('tools.reticulum_guide.page_blurb')}
			</p>
		</div>
	</div>

	<div class="max-w-2xl mx-auto">
		<div class="relative">
			<SearchIcon
				class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={$t('tools.reticulum_guide.search_placeholder')}
				class="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 ring-[#00ADD8] outline-none transition-all"
			/>
		</div>
	</div>

	{#if filteredTutorials.length === 0}
		<div class="text-center py-12">
			<p class="text-zinc-500 dark:text-zinc-400">{$t('common.no_apps_found')}</p>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
			{#each filteredTutorials as chapter (chapter.slug)}
				<a
					href="/tools/reticulum-guide/{chapter.slug}"
					class="group relative p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#00ADD8] hover:shadow-lg transition-all"
				>
					<h2 class="text-xl font-bold mb-2 group-hover:text-[#00ADD8] transition-colors">
						{chapter.title}
					</h2>
					<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{chapter.summary}</p>
					<div class="flex flex-wrap gap-2 mb-4">
						{#each chapter.tags as tag (tag)}
							<span
								class="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
							>
								{tag}
							</span>
						{/each}
					</div>
					<div
						class="flex items-center gap-2 text-sm font-medium text-[#00ADD8] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
					>
						<span>{$t('tools.reticulum_guide.open_chapter')}</span>
						<ArrowRight class="w-4 h-4" />
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
