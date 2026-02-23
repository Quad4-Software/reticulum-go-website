<script lang="ts">
	import '../app.css';
	import { isLoading } from 'svelte-i18n';
	import '../lib/i18n';
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PwaReloadPrompt from '$lib/components/PwaReloadPrompt.svelte';
	import ThemeProvider from '$lib/components/ThemeProvider.svelte';
	import {
		getOrganizationJsonLd,
		getSoftwareApplicationJsonLd,
		getWebSiteJsonLd,
		getCanonicalUrl,
		getHreflangLinks,
		jsonLdScript
	} from '$lib/seo';

	let { children } = $props();

	const canonicalUrl = $derived(getCanonicalUrl(page.url.pathname));
	const hreflangLinks = $derived(getHreflangLinks(page.url.pathname));
	const i18nReady = $derived(!$isLoading);
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

{#if i18nReady}
	<ThemeProvider>
		<div
			class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800"
		>
			<Navbar />
			<main class="flex-1 max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
				{@render children()}
			</main>
			<Footer />
			<PwaReloadPrompt />
		</div>
	</ThemeProvider>
{:else}
	<div class="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
		<div class="h-16 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center gap-4">
			<div class="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
			<div class="h-6 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
		</div>
		<main class="flex-1 max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full space-y-8">
			<div class="h-8 w-64 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
			<div class="space-y-4">
				<div class="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
				<div class="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
				<div class="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
				<div class="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
			</div>
		</main>
	</div>
{/if}
