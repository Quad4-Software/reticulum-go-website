<script lang="ts">
	import { Search as SearchIcon, FileCode, BookOpen, Radio, Bot, ArrowRight } from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface ToolItem {
		id: string;
		href?: string;
		icon: typeof FileCode;
		titleKey: string;
		descriptionKey: string;
		tags: string[];
		status: 'available' | 'coming-soon' | 'alpha';
	}

	const tools: ToolItem[] = [
		{
			id: 'reticulum-guide',
			href: '/tools/reticulum-guide',
			icon: BookOpen,
			titleKey: 'tools.reticulum_guide.title',
			descriptionKey: 'tools.reticulum_guide.description',
			tags: ['reticulum', 'tutorial', 'guide', 'networking'],
			status: 'alpha'
		},
		{
			id: 'micron-editor',
			href: '/tools/micron-editor',
			icon: FileCode,
			titleKey: 'tools.micron_editor.title',
			descriptionKey: 'tools.micron_editor.description',
			tags: ['micron', 'wasm', 'editor', 'parser'],
			status: 'alpha'
		},
		{
			id: 'rnode-flasher',
			icon: Radio,
			titleKey: 'tools.rnode_flasher.title',
			descriptionKey: 'tools.rnode_flasher.description',
			tags: ['rnode', 'flasher', 'firmware', 'lora', 'tiny-reticulum-go', 'serial'],
			status: 'coming-soon'
		},
		{
			id: 'bot-builder',
			icon: Bot,
			titleKey: 'tools.bot_builder.title',
			descriptionKey: 'tools.bot_builder.description',
			tags: ['bot', 'lxmf', 'lxmfy-go', 'builder', 'messaging'],
			status: 'coming-soon'
		}
	];

	let searchQuery = $state('');

	let filteredTools = $derived.by(() => {
		if (!searchQuery.trim()) return tools;
		const query = searchQuery.toLowerCase();
		return tools.filter((tool) => {
			const title = $t(tool.titleKey).toLowerCase();
			const description = $t(tool.descriptionKey).toLowerCase();
			return (
				title.includes(query) ||
				description.includes(query) ||
				tool.tags.some((tag) => tag.toLowerCase().includes(query))
			);
		});
	});
</script>

<svelte:head>
	<title>Tools | Reticulum-Go</title>
	<meta
		name="description"
		content="Browser tools powered by Reticulum-Go and related WASM modules."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="text-center space-y-4">
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">{$t('tools.title')}</h1>
		<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
			{$t('tools.description')}
		</p>
	</div>

	<div class="max-w-2xl mx-auto">
		<div class="relative">
			<SearchIcon
				class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={$t('tools.search_placeholder')}
				class="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 ring-[#00ADD8] outline-none transition-all"
			/>
		</div>
	</div>

	{#if filteredTools.length === 0}
		<div class="text-center py-12">
			<p class="text-zinc-500 dark:text-zinc-400">{$t('common.no_apps_found')}</p>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
			{#each filteredTools as tool (tool.id)}
				{#if (tool.status === 'available' || tool.status === 'alpha') && tool.href}
					<a
						href={tool.href}
						class="group relative p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#00ADD8] hover:shadow-lg transition-all"
					>
						<div class="flex items-start justify-between mb-4">
							<div
								class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-[#00ADD8]/10 transition-colors"
							>
								<tool.icon class="w-6 h-6 text-[#00ADD8]" />
							</div>
							{#if tool.status === 'alpha'}
								<span
									class="px-2 py-1 text-[10px] font-semibold rounded uppercase bg-amber-500 text-white"
								>
									{$t('common.alpha')}
								</span>
							{:else}
								<span
									class="px-2 py-1 text-[10px] font-semibold rounded uppercase bg-[#00ADD8] text-white"
								>
									{$t('common.available')}
								</span>
							{/if}
						</div>
						<h3 class="text-xl font-bold mb-2 group-hover:text-[#00ADD8] transition-colors">
							{$t(tool.titleKey)}
						</h3>
						<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
							{$t(tool.descriptionKey)}
						</p>
						<div class="flex items-center gap-2 text-sm font-medium text-[#00ADD8]">
							<span>{$t('common.explore')}</span>
							<ArrowRight class="w-4 h-4" />
						</div>
					</a>
				{:else}
					<div
						class="relative p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
					>
						<div class="flex items-start justify-between mb-4">
							<div
								class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
							>
								<tool.icon class="w-6 h-6 text-[#00ADD8]" />
							</div>
							<span
								class="px-2 py-1 text-[10px] font-semibold rounded uppercase bg-zinc-500 text-white"
							>
								{$t('common.coming_soon')}
							</span>
						</div>
						<h3 class="text-xl font-bold mb-2">{$t(tool.titleKey)}</h3>
						<p class="text-sm text-zinc-600 dark:text-zinc-400">
							{$t(tool.descriptionKey)}
						</p>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
