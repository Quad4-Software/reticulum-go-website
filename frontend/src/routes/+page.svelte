<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { GitBranch, Lock, Mountain, Code2, Network, ShieldCheck, Boxes } from 'lucide-svelte';
	import { getRepoUpdatedAt, calculateTimeAgo } from '$lib/version';
	import SupportedPlatforms from '$lib/components/SupportedPlatforms.svelte';

	let repoUpdatedAt = $state<string | null>(null);
	let timeAgo = $derived.by(() => calculateTimeAgo(repoUpdatedAt));

	const features = [
		{ key: 'encrypted', Icon: Lock },
		{ key: 'resilient', Icon: Mountain },
		{ key: 'go', Icon: Code2 },
		{ key: 'interop', Icon: Network },
		{ key: 'sandbox', Icon: ShieldCheck },
		{ key: 'modular', Icon: Boxes }
	] as const;

	onMount(async () => {
		repoUpdatedAt = await getRepoUpdatedAt();
	});
</script>

<svelte:head>
	<title>{$t('home.title')} | Resilient, Sovereign Networking</title>
	<meta
		name="description"
		content="Reticulum-Go is a Go implementation of the Reticulum Network Stack. Build resilient, encrypted, and decentralised communication networks."
	/>
</svelte:head>

<div>
	<section class="text-center space-y-8 pt-4 pb-8 sm:pt-6">
		<h1
			class="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500"
		>
			{$t('home.title')}
		</h1>
		<p
			class="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed"
		>
			{$t('home.subtitle')}
		</p>
		<div class="flex flex-col items-center gap-3">
			<div class="flex flex-wrap justify-center gap-4">
				<a
					href="/ren-browser"
					class="relative px-8 py-4 bg-[#00ADD8] text-white font-bold rounded-xl shadow-md hover:shadow-[#00ADD8]/10 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] focus-visible:ring-offset-2"
				>
					{$t('home.try_ren_browser')}
					<span
						class="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
						>{$t('ren_browser.badge')}</span
					>
				</a>
				<a
					href="/source"
					class="px-8 py-4 border border-zinc-200 dark:border-zinc-800 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] focus-visible:ring-offset-2"
				>
					<GitBranch class="w-5 h-5" />
					{$t('home.view_source')}
				</a>
			</div>
			{#if timeAgo}
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					{$t('common.last_activity', {
						values: { time: `${timeAgo.value} ${$t(timeAgo.unit)}` }
					})}
				</p>
			{/if}
		</div>
	</section>

	<section class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 md:mb-24">
		{#each features as feature (feature.key)}
			<div
				class="group p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 transition-colors"
			>
				<div
					class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center transition-colors group-hover:bg-[#00ADD8]"
				>
					<feature.Icon class="w-6 h-6 transition-colors group-hover:text-white" />
				</div>
				<h3 class="text-xl font-bold">{$t(`home.features.${feature.key}.title`)}</h3>
				<p class="text-zinc-500 dark:text-zinc-400">
					{$t(`home.features.${feature.key}.description`)}
				</p>
			</div>
		{/each}
	</section>

	<section class="mb-16 md:mb-24">
		<SupportedPlatforms />
	</section>

	<section class="max-w-3xl mx-auto text-center space-y-4 px-2 mb-16 md:mb-24">
		<h2 class="text-2xl md:text-3xl font-bold tracking-tight">{$t('home.coexistence.title')}</h2>
		<p class="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
			{$t('home.coexistence.description')}
		</p>
		<p class="pt-2">
			<a
				href="https://github.com/markqvist/Reticulum"
				target="_blank"
				rel="noopener noreferrer"
				class="text-[#00ADD8] font-medium hover:underline"
			>
				Python Reticulum (RNS)
			</a>
		</p>
	</section>

	<section
		class="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-12 md:p-20 text-center space-y-6"
	>
		<div class="absolute inset-0 opacity-10 pointer-events-none">
			<div
				class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"
			></div>
		</div>
		<h2 class="text-3xl md:text-5xl font-bold">{$t('home.ren_promo.title')}</h2>
		<p class="text-zinc-400 max-w-4xl mx-auto text-lg">
			{$t('home.ren_promo.description')}
		</p>
		<div class="pt-4">
			<a
				href="/ren-browser"
				class="relative inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-colors"
			>
				{$t('home.ren_promo.cta')}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-4 h-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg
				>
				<span
					class="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
					>{$t('ren_browser.badge')}</span
				>
			</a>
		</div>
	</section>
</div>
