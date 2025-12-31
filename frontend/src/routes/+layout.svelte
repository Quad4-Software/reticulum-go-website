<script lang="ts">
	import '../app.css';
	import { isLoading } from 'svelte-i18n';
	import '../lib/i18n';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onMount, setContext } from 'svelte';

	let { children } = $props();

	let isDark = $state(false);
	let themeInitialized = $state(false);
	let i18nReady = $derived(!$isLoading);

	setContext('theme', {
		get isDark() {
			return isDark;
		},
		toggle: () => {
			isDark = !isDark;
		}
	});

	// Reactive theme application
	$effect(() => {
		if (typeof document !== 'undefined' && themeInitialized) {
			if (isDark) {
				document.documentElement.classList.add('dark');
				localStorage.setItem('theme', 'dark');
			} else {
				document.documentElement.classList.remove('dark');
				localStorage.setItem('theme', 'light');
			}
		}
	});

	onMount(() => {
		// Initialize theme from storage or preference
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('theme');
			if (stored) {
				isDark = stored === 'dark';
			} else {
				isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			}
			themeInitialized = true;
		}
	});
</script>

{#if i18nReady}
	<div
		class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800"
	>
		<Navbar />
		<main class="flex-1 max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
			{@render children()}
		</main>
		<Footer />
	</div>
{:else}
	<div class="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
		<div
			class="w-8 h-8 border-4 border-[#00ADD8] border-t-transparent rounded-full animate-spin"
		></div>
	</div>
{/if}
