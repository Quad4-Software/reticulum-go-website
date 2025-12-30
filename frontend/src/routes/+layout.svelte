<script lang="ts">
	import '../app.css';
	import '../lib/i18n';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { onMount, setContext } from 'svelte';
	import { waitLocale } from 'svelte-i18n';

	let { children } = $props();

	let i18nReady = $state(false);
	let isDark = $state(false);

	setContext('theme', {
		get isDark() {
			return isDark;
		},
		toggle: () => {
			isDark = !isDark;
			applyTheme();
		}
	});

	function applyTheme() {
		if (isDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('color-theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('color-theme', 'light');
		}
	}

	onMount(async () => {
		// Initialize i18n
		try {
			await waitLocale();
		} catch (e) {
			console.error('Failed to load i18n:', e);
		} finally {
			i18nReady = true;
		}

		// Initialize theme
		const stored = localStorage.getItem('color-theme');
		if (stored) {
			isDark = stored === 'dark';
		} else {
			isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		}
		applyTheme();
	});
</script>

{#if i18nReady}
	<div
		class="min-h-screen flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors duration-200 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800"
	>
		<Navbar />
		<main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
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
