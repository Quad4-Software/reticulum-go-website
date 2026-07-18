<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import '../lib/i18n';
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PwaClient from '$lib/components/PwaClient.svelte';
	import { initTheme, isDark as isDarkStore, applyDarkClass, type Theme } from '$lib/theme';
	import {
		getOrganizationJsonLd,
		getSoftwareApplicationJsonLd,
		getWebSiteJsonLd,
		getCanonicalUrl,
		getHreflangLinks,
		jsonLdScript
	} from '$lib/seo';

	let { children, data } = $props();

	const canonicalUrl = $derived(getCanonicalUrl(page.url.pathname));
	const hreflangLinks = $derived(getHreflangLinks(page.url.pathname));
	const isPopout = $derived(page.url.searchParams.get('popout') === '1');
	const isSourcePage = $derived(
		page.url.pathname === '/source' || page.url.pathname.startsWith('/source/')
	);

	let clientDark = $state<boolean | null>(null);
	const resolvedDark = $derived(clientDark ?? data.isDark);

	onMount(() => {
		initTheme(data.currentTheme as Theme);
		const unsub = isDarkStore.subscribe((dark) => {
			clientDark = dark;
			applyDarkClass(dark);
		});
		return unsub;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl} />
	{#each hreflangLinks as link (link.lang)}
		<link rel="alternate" hreflang={link.lang} href={link.href} />
	{/each}
	{@html jsonLdScript(getOrganizationJsonLd())}
	{@html jsonLdScript(getSoftwareApplicationJsonLd())}
	{@html jsonLdScript(getWebSiteJsonLd())}
</svelte:head>

<div
	class:dark={resolvedDark}
	class="flex min-h-dvh flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 {isPopout
		? 'h-dvh overflow-hidden'
		: ''}"
>
	{#if !isPopout}
		<Navbar currentPath={data.currentPath} currentTheme={data.currentTheme} />
	{/if}
	<main
		class="min-w-0 flex-1 {isPopout
			? 'flex h-full max-w-none flex-col overflow-hidden p-0'
			: isSourcePage
				? 'mx-auto w-full max-w-[2000px] px-4 pt-3 pb-8 sm:px-6 sm:pt-4 sm:pb-12 lg:px-8'
				: 'mx-auto w-full max-w-[2000px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8'}"
	>
		{@render children()}
	</main>
	{#if !isPopout}
		<Footer />
	{/if}
	<PwaClient />
</div>
