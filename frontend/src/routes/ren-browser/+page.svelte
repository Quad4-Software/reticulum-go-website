<script lang="ts">
	import { t } from 'svelte-i18n';
	import {
		Download,
		GitBranch,
		Globe,
		Users,
		Radio,
		FileText,
		Pencil,
		Puzzle,
		Monitor,
		Languages,
		Smartphone,
		Server,
		BookOpen,
		Layout,
		ChevronRight
	} from 'lucide-svelte';

	const features = [
		{ key: 'nomadnet', icon: Globe },
		{ key: 'identities', icon: Users },
		{ key: 'interfaces', icon: Radio },
		{ key: 'documents', icon: FileText },
		{ key: 'editor', icon: Pencil },
		{ key: 'extensions', icon: Puzzle },
		{ key: 'platforms', icon: Monitor },
		{ key: 'i18n', icon: Languages }
	] as const;

	const gallery = [
		{ key: 'home', file: 'home' },
		{ key: 'discovery', file: 'discovery' },
		{ key: 'editor', file: 'editor' },
		{ key: 'settings', file: 'settings' },
		{ key: 'about', file: 'about' }
	] as const;

	const mobileShots = [
		{ key: 'home', file: 'home' },
		{ key: 'discovery', file: 'discovery' }
	] as const;
</script>

<svelte:head>
	<title>{$t('ren_browser.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('ren_browser.subtitle')} />
</svelte:head>

<div class="space-y-24">
	<div class="space-y-12">
		<section class="text-center space-y-6 -mt-4 pb-0">
			<h1
				class="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500"
			>
				{$t('ren_browser.title')}
			</h1>
			<p
				class="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed"
			>
				{$t('ren_browser.subtitle')}
			</p>
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="https://github.com/Quad4-Software/Ren-Browser/releases/latest"
					target="_blank"
					rel="noopener noreferrer"
					class="px-8 py-4 bg-[#00ADD8] text-white font-bold rounded-xl shadow-md hover:shadow-[#00ADD8]/10 transition-all active:scale-95 inline-flex items-center gap-2"
				>
					<Download class="w-5 h-5" />
					{$t('ren_browser.download')}
				</a>
				<a
					href="https://github.com/Quad4-Software/Ren-Browser"
					target="_blank"
					rel="noopener noreferrer"
					class="px-8 py-4 border border-zinc-200 dark:border-zinc-800 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95 inline-flex items-center gap-2"
				>
					<GitBranch class="w-5 h-5" />
					{$t('ren_browser.view_source')}
				</a>
			</div>
		</section>

		<section class="max-w-5xl mx-auto px-4">
			<img
				src="/ren-browser/desktop/light/home.png"
				alt={$t('ren_browser.hero_alt')}
				class="w-full rounded-2xl border border-zinc-200 shadow-sm dark:hidden aspect-[16/10] object-cover"
			/>
			<img
				src="/ren-browser/desktop/dark/home.png"
				alt={$t('ren_browser.hero_alt')}
				class="w-full rounded-2xl border border-zinc-800 shadow-sm hidden dark:block aspect-[16/10] object-cover"
			/>
		</section>
	</div>

	<section class="space-y-8">
		<h2 class="text-3xl md:text-4xl font-bold text-center">{$t('ren_browser.features_title')}</h2>
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each features as feature (feature.key)}
				<div class="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
					<div
						class="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
					>
						<feature.icon class="w-5 h-5 text-[#00ADD8]" />
					</div>
					<h3 class="text-lg font-bold">{$t(`ren_browser.features.${feature.key}.title`)}</h3>
					<p class="text-sm text-zinc-500 dark:text-zinc-400">
						{$t(`ren_browser.features.${feature.key}.description`)}
					</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="space-y-8">
		<h2 class="text-3xl md:text-4xl font-bold text-center">{$t('ren_browser.gallery_title')}</h2>
		<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each gallery as shot (shot.key)}
				<figure class="space-y-3">
					<img
						src={`/ren-browser/desktop/light/${shot.file}.png`}
						alt={$t(`ren_browser.gallery.${shot.key}`)}
						class="w-full rounded-2xl border border-zinc-200 shadow-sm dark:hidden aspect-[16/10] object-cover"
					/>
					<img
						src={`/ren-browser/desktop/dark/${shot.file}.png`}
						alt={$t(`ren_browser.gallery.${shot.key}`)}
						class="w-full rounded-2xl border border-zinc-800 shadow-sm hidden dark:block aspect-[16/10] object-cover"
					/>
					<figcaption class="text-sm font-medium text-zinc-600 dark:text-zinc-400 text-center">
						{$t(`ren_browser.gallery.${shot.key}`)}
					</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section class="space-y-8">
		<div class="text-center space-y-3">
			<div class="inline-flex items-center justify-center gap-2">
				<Smartphone class="w-6 h-6 text-[#00ADD8]" />
				<h2 class="text-3xl md:text-4xl font-bold">{$t('ren_browser.mobile_title')}</h2>
			</div>
			<p class="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
				{$t('ren_browser.mobile_description')}
			</p>
		</div>
		<div class="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto">
			{#each mobileShots as shot (shot.key)}
				<figure class="w-40 sm:w-48 space-y-3">
					<img
						src={`/ren-browser/mobile/light/${shot.file}.png`}
						alt={$t(`ren_browser.gallery.${shot.key}`)}
						class="w-full rounded-2xl border border-zinc-200 shadow-sm dark:hidden aspect-[9/19.5] object-cover"
					/>
					<img
						src={`/ren-browser/mobile/dark/${shot.file}.png`}
						alt={$t(`ren_browser.gallery.${shot.key}`)}
						class="w-full rounded-2xl border border-zinc-800 shadow-sm hidden dark:block aspect-[9/19.5] object-cover"
					/>
					<figcaption class="text-sm font-medium text-zinc-600 dark:text-zinc-400 text-center">
						{$t(`ren_browser.gallery.${shot.key}`)}
					</figcaption>
				</figure>
			{/each}
		</div>
	</section>

	<section
		class="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-10 md:p-16 space-y-12 text-center"
	>
		<div class="space-y-4">
			<h2 class="text-3xl md:text-4xl font-bold">{$t('ren_browser.get_title')}</h2>
			<p class="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
				{$t('ren_browser.get_description')}
			</p>
			<p class="text-sm text-zinc-500 dark:text-zinc-500">{$t('ren_browser.note')}</p>
		</div>

		<div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
			<div class="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
				<div class="flex items-center gap-3 text-[#00ADD8]">
					<Layout class="w-6 h-6" />
					<h3 class="font-bold text-lg">{$t('ren_browser.platforms_app_title')}</h3>
				</div>
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
					{$t('ren_browser.platforms_app_list')}
				</p>
				<div class="pt-2">
					<a
						href="https://github.com/Quad4-Software/Ren-Browser/releases/latest"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 text-sm font-bold text-[#00ADD8] hover:underline"
					>
						{$t('ren_browser.releases')}
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
			</div>

			<div class="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-4">
				<div class="flex items-center gap-3 text-[#00ADD8]">
					<Server class="w-6 h-6" />
					<h3 class="font-bold text-lg">{$t('ren_browser.platforms_web_title')}</h3>
				</div>
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
					{$t('ren_browser.platforms_web_list')}
				</p>
				<div class="pt-2">
					<a
						href="https://github.com/Quad4-Software/Ren-Browser/pkgs/container/renbrowser"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 text-sm font-bold text-[#00ADD8] hover:underline"
					>
						{$t('ren_browser.docker')}
						<ChevronRight class="w-4 h-4" />
					</a>
				</div>
			</div>
		</div>

		<div class="flex flex-wrap justify-center gap-4 pt-4">
			<a
				href="https://github.com/Quad4-Software/Ren-Browser/releases/latest"
				target="_blank"
				rel="noopener noreferrer"
				class="px-6 py-3 bg-[#00ADD8] text-white font-bold rounded-xl hover:bg-[#00ADD8]/90 transition-colors inline-flex items-center gap-2"
			>
				<Download class="w-4 h-4" />
				{$t('ren_browser.download')}
			</a>
			<a
				href="https://github.com/Quad4-Software/Ren-Browser/tree/master/docs/en"
				target="_blank"
				rel="noopener noreferrer"
				class="px-6 py-3 border border-zinc-200 dark:border-zinc-800 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-2"
			>
				<BookOpen class="w-4 h-4" />
				{$t('ren_browser.docs')}
			</a>
		</div>
		<p class="text-xs text-zinc-400 font-mono">ghcr.io/quad4-software/renbrowser</p>
	</section>
</div>
