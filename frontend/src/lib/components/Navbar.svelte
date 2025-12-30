<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import Logo from './Logo.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages } from 'lucide-svelte';

	const isWasmRoute = $derived(page.url.pathname.startsWith('/wasm-example'));
</script>

<nav
	class="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md"
>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16 items-center">
			<a href="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
				<Logo />
				<span class="text-xl font-bold tracking-tight">{$t('home.title')}</span>
			</a>

			<div
				class="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-400"
			>
				<a
					href="/"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname ===
					'/'
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.home')}</a
				>
				<a
					href="/docs"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname.startsWith(
						'/docs'
					)
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.docs')}</a
				>
				<a
					href="/wasm-example"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {isWasmRoute
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.wasm_example')}</a
				>

				{#if isWasmRoute}
					<div class="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
					<a
						href="/wasm-example/identity"
						class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url
							.pathname === '/wasm-example/identity'
							? 'text-zinc-900 dark:text-white'
							: ''}">{$t('common.identity')}</a
					>
					<a
						href="/wasm-example/settings"
						class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url
							.pathname === '/wasm-example/settings'
							? 'text-zinc-900 dark:text-white'
							: ''}">{$t('common.settings')}</a
					>
				{/if}

				<a
					href="/contact"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname ===
					'/contact'
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.contact')}</a
				>
			</div>

			<div class="flex items-center gap-4">
				<div class="relative group flex items-center">
					<Languages
						class="w-5 h-5 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors cursor-pointer pointer-events-none"
					/>
					<select
						bind:value={$locale}
						class="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
						aria-label="Select Language"
					>
						{#each $locales as l}
							<option value={l} class="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
								{l.toUpperCase()}
							</option>
						{/each}
					</select>
				</div>
				<a
					href="https://git.quad4.io/Networks/Reticulum-Go"
					target="_blank"
					rel="noopener noreferrer"
					class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					aria-label="Source Code"
				>
					<img src="/gitea.svg" alt="Gitea" class="w-5 h-5" />
				</a>
				<ThemeToggle />
				<button class="md:hidden p-2 text-zinc-600 dark:text-zinc-400" aria-label="Toggle menu">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line
							x1="3"
							y1="18"
							x2="21"
							y2="18"
						/></svg
					>
				</button>
			</div>
		</div>
	</div>
</nav>
