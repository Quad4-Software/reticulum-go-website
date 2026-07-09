<script lang="ts">
	import '../app.css';
	import '../lib/i18n';
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PwaClient from '$lib/components/PwaClient.svelte';
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
	class:dark={data.isDark}
	class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800"
>
	<Navbar currentPath={data.currentPath} currentTheme={data.currentTheme} />
	<main class="flex-1 max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
		{@render children()}
	</main>
	<Footer />
	<PwaClient />
</div>
