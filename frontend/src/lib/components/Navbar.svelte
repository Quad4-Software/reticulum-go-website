<script lang="ts">
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages, ChevronDown, Check, Menu, X, GitBranch } from 'lucide-svelte';
	import { LOCALE_LABELS } from '$lib/site-config';

	let { currentPath = '/', currentTheme = 'system' } = $props();

	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (menuOpen && event.key === 'Escape') {
			event.preventDefault();
			closeMenu();
		}
	}

	function navClass(active: boolean, mobile = false) {
		if (mobile) {
			return active
				? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
				: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900';
		}
		return active ? 'text-zinc-900 dark:text-white' : '';
	}

	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

<nav
	class="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative"
>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16 items-center gap-2 min-w-0">
			<a
				href="/"
				class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 shrink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded-lg"
			>
				<Logo />
				<span class="text-lg sm:text-xl font-bold tracking-tight truncate">{$t('home.title')}</span>
			</a>

			<div
				class="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400"
			>
				<a
					href="/"
					aria-current={page.url.pathname === '/' ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname === '/'
					)}">{$t('common.home')}</a
				>
				<a
					href="/docs"
					aria-current={page.url.pathname.startsWith('/docs') ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname.startsWith('/docs')
					)}">{$t('common.docs')}</a
				>
				<a
					href="/tools"
					aria-current={page.url.pathname.startsWith('/tools') ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname.startsWith('/tools')
					)}">{$t('common.tools')}</a
				>
				<a
					href="/apps"
					aria-current={page.url.pathname.startsWith('/apps') ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname.startsWith('/apps')
					)}">{$t('common.apps')}</a
				>
				<a
					href="/donate"
					aria-current={page.url.pathname === '/donate' ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname === '/donate'
					)}">{$t('common.donate')}</a
				>
				<a
					href="/contact"
					aria-current={page.url.pathname === '/contact' ? 'page' : undefined}
					class="hover:text-zinc-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded {navClass(
						page.url.pathname === '/contact'
					)}">{$t('common.contact')}</a
				>
			</div>

			<div class="flex items-center gap-1.5 sm:gap-4 shrink-0">
				<details class="relative">
					<summary
						aria-label="Select language"
						class="list-none cursor-pointer flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 text-sm font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
					>
						<Languages class="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
						<span class="min-w-0 max-w-[5rem] sm:min-w-[4.5rem] text-left truncate hidden sm:inline"
							>{LOCALE_LABELS[$locale as keyof typeof LOCALE_LABELS] ?? $locale ?? 'en'}</span
						>
						<ChevronDown
							class="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 hidden sm:block"
						/>
					</summary>
					<div
						class="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-[70]"
						role="listbox"
						aria-label="Language options"
					>
						{#each $locales as l (l)}
							<a
								href={`/set-locale?locale=${l}&redirect=${encodeURIComponent(currentPath)}`}
								data-sveltekit-preload-data="false"
								data-sveltekit-preload-code="false"
								aria-current={$locale === l ? 'true' : undefined}
								class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors {$locale ===
								l
									? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
									: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'}"
							>
								<span>{LOCALE_LABELS[l as keyof typeof LOCALE_LABELS] ?? l}</span>
								{#if $locale === l}
									<Check class="w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-300" />
								{/if}
							</a>
						{/each}
					</div>
				</details>
				<ThemeToggle {currentPath} {currentTheme} />
				<a
					href="/source"
					class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
					aria-label={$t('common.source_code')}
				>
					<GitBranch class="w-5 h-5" />
				</a>
				<button
					type="button"
					class="md:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
					onclick={toggleMenu}
					aria-expanded={menuOpen}
					aria-controls="mobile-nav-panel"
					aria-label={menuOpen ? 'Close menu' : 'Open menu'}
				>
					{#if menuOpen}
						<X class="w-6 h-6" />
					{:else}
						<Menu class="w-6 h-6" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	{#if menuOpen}
		<button
			type="button"
			class="fixed inset-0 z-[55] bg-black/30 md:hidden"
			onclick={closeMenu}
			aria-label="Close menu"
		></button>
		<div
			id="mobile-nav-panel"
			class="md:hidden absolute left-0 right-0 top-full z-[60] border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-lg"
		>
			<div class="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1 text-base font-medium">
				<a
					href="/"
					onclick={closeMenu}
					aria-current={page.url.pathname === '/' ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname === '/',
						true
					)}">{$t('common.home')}</a
				>
				<a
					href="/docs"
					onclick={closeMenu}
					aria-current={page.url.pathname.startsWith('/docs') ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname.startsWith('/docs'),
						true
					)}">{$t('common.docs')}</a
				>
				<a
					href="/tools"
					onclick={closeMenu}
					aria-current={page.url.pathname.startsWith('/tools') ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname.startsWith('/tools'),
						true
					)}">{$t('common.tools')}</a
				>
				<a
					href="/apps"
					onclick={closeMenu}
					aria-current={page.url.pathname.startsWith('/apps') ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname.startsWith('/apps'),
						true
					)}">{$t('common.apps')}</a
				>
				<a
					href="/donate"
					onclick={closeMenu}
					aria-current={page.url.pathname === '/donate' ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname === '/donate',
						true
					)}">{$t('common.donate')}</a
				>
				<a
					href="/contact"
					onclick={closeMenu}
					aria-current={page.url.pathname === '/contact' ? 'page' : undefined}
					class="py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname === '/contact',
						true
					)}">{$t('common.contact')}</a
				>
				<a
					href="/source"
					onclick={closeMenu}
					aria-current={page.url.pathname === '/source' ? 'page' : undefined}
					class="sm:hidden flex items-center gap-2 py-2.5 px-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] {navClass(
						page.url.pathname === '/source',
						true
					)}"
				>
					<GitBranch class="w-5 h-5" />
					<span>{$t('common.source_code')}</span>
				</a>
			</div>
		</div>
	{/if}
</nav>
