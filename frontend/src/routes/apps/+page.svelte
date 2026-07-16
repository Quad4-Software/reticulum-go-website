<script lang="ts">
	import {
		Search as SearchIcon,
		Terminal,
		Globe,
		Bot,
		ExternalLink,
		FileCode,
		Server,
		MessageCircle,
		Store,
		Layers,
		Cpu
	} from 'lucide-svelte';
	import { t } from 'svelte-i18n';

	interface AppItem {
		name: string;
		description: string;
		icon: typeof Terminal;
		tags: string[];
		platforms: string[];
		status: 'available' | 'coming-soon';
		link?: string;
		demoLink?: string;
	}

	const apps: AppItem[] = [
		{
			name: 'Ren Browser',
			description:
				'Modern NomadNet-compatible browser for the Reticulum network. Renders Micron pages, manages identities and interfaces, includes a Micron editor, extensions, and desktop, mobile, and headless server builds.',
			icon: Globe,
			tags: ['browser', 'nomadnet', 'micron', 'desktop', 'mobile', 'reticulum-go'],
			platforms: ['Linux', 'Windows', 'macOS', 'Android', 'Docker'],
			status: 'available',
			link: '/ren-browser'
		},
		{
			name: 'Micron Parser Go',
			description:
				'High-performance Micron parser and HTML renderer for Go and WebAssembly. Powers NomadNet page rendering in Ren Browser and ships a browser playground.',
			icon: FileCode,
			tags: ['micron', 'parser', 'wasm', 'library', 'nomadnet'],
			platforms: ['Go', 'WebAssembly', 'Browser'],
			status: 'available',
			link: 'https://github.com/Quad4-Software/Micron-Parser-Go',
			demoLink: '/tools/micron-editor'
		},
		{
			name: 'WASM Demo',
			description:
				'Interactive chat demo using Reticulum-Go compiled to WebAssembly. Connect to a gateway, discover peers, and send messages from the browser.',
			icon: Cpu,
			tags: ['wasm', 'chat', 'demo', 'reticulum-go', 'browser'],
			platforms: ['Browser', 'WebAssembly'],
			status: 'available',
			demoLink: '/wasm-example'
		},
		{
			name: 'Ren Chat',
			description:
				'LXMF messaging client for conversations over Reticulum. Built around Reticulum-Go for portable, encrypted chat across the mesh.',
			icon: MessageCircle,
			tags: ['chat', 'lxmf', 'messaging', 'reticulum-go'],
			platforms: ['Linux', 'Windows', 'macOS', 'Android'],
			status: 'coming-soon'
		},
		{
			name: 'Ren Store',
			description:
				'App and package discovery for the Ren ecosystem. Browse, install, and update Reticulum-related software from one place.',
			icon: Store,
			tags: ['store', 'packages', 'distribution', 'ren'],
			platforms: ['Linux', 'Windows', 'macOS', 'Android'],
			status: 'coming-soon'
		},
		{
			name: 'Strata API Framework',
			description:
				'API framework for building services and integrations on Reticulum-Go. Structured endpoints, tooling, and reusable building blocks for mesh-native apps.',
			icon: Layers,
			tags: ['api', 'framework', 'reticulum-go', 'services'],
			platforms: ['Go', 'Linux', 'BSD'],
			status: 'coming-soon'
		},
		{
			name: 'TUI',
			description:
				'A TUI for navigating the Reticulum network. Connect, communicate, and explore the mesh network from your terminal with a modern TUI experience.',
			icon: Terminal,
			tags: ['tui', 'terminal', 'mesh', 'network'],
			platforms: ['Linux', 'macOS', 'Windows', 'BSD'],
			status: 'coming-soon'
		},
		{
			name: 'LXMFy-Go',
			description: 'A Go-based bot framework for creating LXMF bots on the Reticulum network.',
			icon: Bot,
			tags: ['bot', 'framework', 'lxmf', 'go'],
			platforms: ['Linux', 'macOS', 'Windows', 'BSD'],
			status: 'coming-soon'
		}
	];

	let searchQuery = $state('');
	let filteredApps = $derived.by(() => {
		if (!searchQuery.trim()) return apps;
		const query = searchQuery.toLowerCase();
		return apps.filter(
			(app) =>
				app.name.toLowerCase().includes(query) ||
				app.description.toLowerCase().includes(query) ||
				app.tags.some((tag) => tag.toLowerCase().includes(query)) ||
				app.platforms.some((platform) => platform.toLowerCase().includes(query))
		);
	});
</script>

<svelte:head>
	<title>Applications | Reticulum-Go</title>
	<meta
		name="description"
		content="Applications and tools built with Reticulum-Go, including Ren Browser, Micron Parser Go, and the WASM Demo."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="text-center space-y-4">
		<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">{$t('apps.title')}</h1>
		<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
			{$t('apps.description')}
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
				placeholder={$t('apps.search_placeholder')}
				class="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 ring-[#00ADD8] outline-none transition-all"
			/>
		</div>
	</div>

	{#if filteredApps.length === 0}
		<div class="text-center py-12">
			<p class="text-zinc-500 dark:text-zinc-400">{$t('common.no_apps_found')}</p>
		</div>
	{:else}
		<div class="grid md:grid-cols-2 gap-6">
			{#each filteredApps as app (app.name)}
				<div
					class="relative p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
				>
					<div class="flex items-start justify-between mb-4">
						<div
							class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
						>
							<app.icon class="w-6 h-6 text-[#00ADD8]" />
						</div>
						<span
							class="px-2 py-1 text-[10px] font-semibold rounded uppercase {app.status ===
							'available'
								? 'bg-[#00ADD8] text-white'
								: 'bg-zinc-500 text-white'}"
						>
							{app.status === 'available' ? $t('common.available') : $t('common.coming_soon')}
						</span>
					</div>
					<h3 class="text-xl font-bold mb-2">{app.name}</h3>
					<p class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{app.description}</p>
					<div class="space-y-3">
						<div class="flex flex-wrap gap-2">
							{#each app.platforms as platform (platform)}
								<span
									class="px-2 py-1 text-xs font-medium rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
								>
									{platform}
								</span>
							{/each}
						</div>
						<div class="flex flex-wrap gap-4">
							{#if app.link}
								{@const external = app.link.startsWith('http')}
								<a
									href={app.link}
									target={external ? '_blank' : undefined}
									rel={external ? 'noopener noreferrer' : undefined}
									class="inline-flex items-center gap-2 text-sm font-medium text-[#00ADD8] hover:underline"
								>
									<span>{$t('common.learn_more')}</span>
									{#if external}
										<ExternalLink class="w-4 h-4" />
									{/if}
								</a>
							{/if}
							{#if app.demoLink}
								{@const demoExternal = app.demoLink.startsWith('http')}
								<a
									href={app.demoLink}
									target={demoExternal ? '_blank' : undefined}
									rel={demoExternal ? 'noopener noreferrer' : undefined}
									class="inline-flex items-center gap-2 text-sm font-medium text-[#00ADD8] hover:underline"
								>
									<span>{$t('common.try_demo')}</span>
									{#if demoExternal}
										<Server class="w-4 h-4" />
									{/if}
								</a>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
