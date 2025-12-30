<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { getRepoUpdatedAt, calculateTimeAgo } from '$lib/version';

	let repoUpdatedAt = $state<string | null>(null);
	let timeAgo = $derived.by(() => calculateTimeAgo(repoUpdatedAt));
	let showActivity = $state(false);

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

<div class="space-y-24">
	<!-- Hero Section -->
	<section class="text-center space-y-8 py-12">
		<h1
			class="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500"
		>
			{$t('home.title')}
		</h1>
		<p
			class="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed"
		>
			{$t('home.subtitle')}
		</p>
		<div class="flex flex-wrap justify-center gap-4">
			<a
				href="/wasm-example"
				class="px-8 py-4 bg-[#00ADD8] text-white font-bold rounded-xl shadow-lg hover:shadow-[#00ADD8]/20 transition-all active:scale-95"
			>
				{$t('home.try_wasm')}
			</a>
			<div class="relative group">
				<a
					href="https://git.quad4.io/Networks/Reticulum-Go"
					target="_blank"
					rel="noopener noreferrer"
					class="px-8 py-4 border border-zinc-200 dark:border-zinc-800 font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95 flex items-center gap-2"
					onmouseenter={() => (showActivity = true)}
					onmouseleave={() => (showActivity = false)}
				>
					<img src="/gitea.svg" alt="" class="w-5 h-5" />
					{$t('home.view_source')}
				</a>
				{#if showActivity && timeAgo}
					<div
						class="absolute top-full left-0 right-0 mt-2 text-xs text-zinc-500 dark:text-zinc-400 animate-in fade-in slide-in-from-top-1 duration-200"
					>
						{$t('common.last_activity', {
							values: { time: `${timeAgo.value} ${$t(timeAgo.unit)}` }
						})}
					</div>
				{/if}
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="grid md:grid-cols-3 gap-8">
		<div class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
			<div
				class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-6 h-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path
						d="M7 11V7a5 5 0 0 1 10 0v4"
					/></svg
				>
			</div>
			<h3 class="text-xl font-bold">{$t('home.features.encrypted.title')}</h3>
			<p class="text-zinc-500 dark:text-zinc-400">
				{$t('home.features.encrypted.description')}
			</p>
		</div>

		<div class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
			<div
				class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-6 h-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg
				>
			</div>
			<h3 class="text-xl font-bold">{$t('home.features.resilient.title')}</h3>
			<p class="text-zinc-500 dark:text-zinc-400">
				{$t('home.features.resilient.description')}
			</p>
		</div>

		<div class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
			<div
				class="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-6 h-6"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg
				>
			</div>
			<h3 class="text-xl font-bold">{$t('home.features.go.title')}</h3>
			<p class="text-zinc-500 dark:text-zinc-400">
				{$t('home.features.go.description')}
			</p>
		</div>
	</section>

	<!-- WASM Promotion -->
	<section
		class="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-12 md:p-20 text-center space-y-6"
	>
		<div class="absolute inset-0 opacity-10 pointer-events-none">
			<div
				class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"
			></div>
		</div>
		<h2 class="text-3xl md:text-4xl font-bold">{$t('home.wasm_promo.title')}</h2>
		<p class="text-zinc-400 max-w-2xl mx-auto">
			{$t('home.wasm_promo.description')}
		</p>
		<div class="pt-4">
			<a
				href="/wasm-example"
				class="inline-flex items-center gap-2 px-8 py-3 bg-white text-zinc-900 font-bold rounded-xl hover:bg-zinc-100 transition-colors"
			>
				{$t('home.wasm_promo.cta')}
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
			</a>
		</div>
	</section>
</div>
