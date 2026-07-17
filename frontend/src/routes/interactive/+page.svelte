<script lang="ts">
	import {
		Search as SearchIcon,
		Code,
		FileCode,
		BookOpen,
		ExternalLink,
		Radio
	} from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface InteractiveItem {
		title: string;
		description: string;
		href: string;
		icon: typeof Code;
		tags: string[];
		status?: 'wip' | 'stable';
	}

	const items: InteractiveItem[] = [
		{
			title: 'WASM Chat Example',
			description:
				'Interactive chat demonstration using Reticulum-Go compiled to WebAssembly. Connect to the network, discover peers, and send messages directly from your browser.',
			href: '/wasm-example',
			icon: Code,
			tags: ['wasm', 'chat', 'demo', 'interactive'],
			status: 'wip'
		},
		{
			title: 'Micron Editor',
			description:
				'Live Micron markup editor with smooth WASM preview via Micron-Parser-Go. Works offline after the first visit through the site PWA.',
			href: '/tools/micron-editor',
			icon: FileCode,
			tags: ['micron', 'wasm', 'editor', 'tools'],
			status: 'stable'
		},
		{
			title: 'Reticulum Guide',
			description:
				'Visual tutorials on destinations, announces, cryptography, packets, links, messaging, and interfaces, grounded in the official Reticulum manual.',
			href: '/tools/reticulum-guide',
			icon: BookOpen,
			tags: ['tutorial', 'reticulum', 'cryptography', 'transport', 'lxmf'],
			status: 'stable'
		},
		{
			title: 'RNode Flasher',
			description:
				'Flash and provision RNode firmware in the browser over Web Serial Bluetooth IP or the built-in simulator.',
			href: '/tools/rnode-flasher',
			icon: Radio,
			tags: ['rnode', 'flasher', 'firmware', 'serial', 'tools'],
			status: 'wip'
		}
	];

	let searchQuery = $state('');
	let filteredItems = $derived.by(() => {
		if (!searchQuery.trim()) return items;
		const query = searchQuery.toLowerCase();
		return items.filter(
			(item) =>
				item.title.toLowerCase().includes(query) ||
				item.description.toLowerCase().includes(query) ||
				item.tags.some((tag) => tag.toLowerCase().includes(query))
		);
	});
</script>

<svelte:head>
	<title>Interactive Examples | Reticulum-Go</title>
	<meta
		name="description"
		content="Interactive examples, tutorials, and demonstrations of Reticulum-Go in action."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="text-center space-y-4">
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">{$t('interactive.title')}</h1>
		<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
			{$t('interactive.description')}
		</p>
	</div>

	<div class="max-w-4xl mx-auto">
		<div class="relative">
			<SearchIcon
				class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder={$t('interactive.search_placeholder')}
				class="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 ring-[#00ADD8] outline-none transition-all"
			/>
		</div>
	</div>

	{#if filteredItems.length === 0}
		<div class="text-center py-12">
			<p class="text-zinc-500 dark:text-zinc-400">{$t('common.no_examples_found')}</p>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
			{#each filteredItems as item (item.href)}
				<a
					href={item.href}
					class="group relative p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#00ADD8] hover:shadow-lg transition-all"
				>
					<div class="flex items-start justify-between mb-4">
						<div
							class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:bg-[#00ADD8]/10 transition-colors"
						>
							<item.icon class="w-6 h-6 text-[#00ADD8]" />
						</div>
						{#if item.status === 'wip'}
							<span
								class="px-2 py-1 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
							>
								Beta
							</span>
						{/if}
					</div>
					<h3 class="text-xl font-bold mb-2 group-hover:text-[#00ADD8] transition-colors">
						{item.title}
					</h3>
					<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-3">
						{item.description}
					</p>
					<div class="flex items-center gap-2 text-sm font-medium text-[#00ADD8]">
						<span>{$t('common.explore')}</span>
						<ExternalLink class="w-4 h-4" />
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
