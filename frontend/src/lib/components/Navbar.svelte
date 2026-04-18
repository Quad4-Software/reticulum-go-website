<script lang="ts">
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages, ChevronDown, Check, Menu, X } from 'lucide-svelte';
	import { LOCALE_LABELS } from '$lib/site-config';

	let { currentPath = '/', currentTheme = 'system' } = $props();

	let menuOpen = $state(false);

	function closeMenu() {
		menuOpen = false;
	}

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	$effect(() => {
		void page.url.pathname;
		menuOpen = false;
	});
</script>

<nav
	class="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative"
>
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex justify-between h-16 items-center gap-2 min-w-0">
			<a
				href="/"
				class="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0 shrink"
			>
				<Logo />
				<span class="text-lg sm:text-xl font-bold tracking-tight truncate">{$t('home.title')}</span>
			</a>

			<div
				class="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
					href="/interactive"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname.startsWith(
						'/interactive'
					)
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.interactive')}</a
				>
				<a
					href="/apps"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname.startsWith(
						'/apps'
					)
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.apps')}</a
				>
				<a
					href="/donate"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname ===
					'/donate'
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.donate')}</a
				>
				<a
					href="/contact"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname ===
					'/contact'
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.contact')}</a
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
						<ChevronDown class="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 hidden sm:block" />
					</summary>
					<div
						class="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-[70]"
						role="listbox"
						aria-label="Language options"
					>
						{#each $locales as l (l)}
							<a
								href={`/set-locale?locale=${l}&redirect=${encodeURIComponent(currentPath)}`}
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
					href="https://git.quad4.io/Networks/Reticulum-Go"
					target="_blank"
					rel="noopener noreferrer"
					class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors hidden sm:flex"
					aria-label="Source Code"
				>
					<img src="/gitea.svg" alt="Gitea" class="w-5 h-5" />
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
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname === '/'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.home')}</a
				>
				<a
					href="/docs"
					onclick={closeMenu}
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname.startsWith('/docs')
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.docs')}</a
				>
				<a
					href="/interactive"
					onclick={closeMenu}
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname.startsWith(
						'/interactive'
					)
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.interactive')}</a
				>
				<a
					href="/apps"
					onclick={closeMenu}
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname.startsWith('/apps')
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.apps')}</a
				>
				<a
					href="/donate"
					onclick={closeMenu}
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname === '/donate'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.donate')}</a
				>
				<a
					href="/contact"
					onclick={closeMenu}
					class="py-2.5 px-3 rounded-lg transition-colors {page.url.pathname === '/contact'
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
					>{$t('common.contact')}</a
				>
				<a
					href="https://git.quad4.io/Networks/Reticulum-Go"
					target="_blank"
					rel="noopener noreferrer"
					onclick={closeMenu}
					class="sm:hidden flex items-center gap-2 py-2.5 px-3 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
				>
					<img src="/gitea.svg" alt="" class="w-5 h-5" />
					<span>Source</span>
				</a>
			</div>
		</div>
	{/if}
</nav>
