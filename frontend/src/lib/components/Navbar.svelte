<script lang="ts">
	// import ThemeToggle from './ThemeToggle.svelte';
	import Logo from './Logo.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages, Menu, X } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	const isWasmRoute = $derived(page.url.pathname.startsWith('/wasm-example'));
	let isMobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}
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
					class="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-white transition-colors {isWasmRoute
						? 'text-zinc-900 dark:text-white'
						: ''}"
					>{$t('common.wasm_example')}
					<span
						class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
						>WIP</span
					></a
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
						{#each $locales as l (l)}
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
				<!-- <ThemeToggle /> -->
				<button
					onclick={toggleMobileMenu}
					class="md:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
					aria-label="Toggle menu"
				>
					{#if isMobileMenuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile Menu -->
	{#if isMobileMenuOpen}
		<div
			transition:slide
			class="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
		>
			<div class="px-4 pt-2 pb-6 space-y-1">
				<a
					href="/"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname === '/'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.home')}
				</a>
				<a
					href="/docs"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname.startsWith(
						'/docs'
					)
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.docs')}
				</a>
				<a
					href="/wasm-example"
					onclick={() => (isMobileMenuOpen = false)}
					class="flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium {isWasmRoute
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					<span>{$t('common.wasm_example')}</span>
					<span
						class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
						>WIP</span
					>
				</a>
				<a
					href="/donate"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname === '/donate'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.donate')}
				</a>
				<a
					href="/contact"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname === '/contact'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.contact')}
				</a>
			</div>
		</div>
	{/if}
</nav>
