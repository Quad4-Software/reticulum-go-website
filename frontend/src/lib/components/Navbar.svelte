<script lang="ts">
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages, Menu, X, ChevronDown, Check } from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	const localeNames: Record<string, string> = {
		en: 'English',
		de: 'Deutsch',
		ru: 'Русский',
		it: 'Italiano'
	};

	let isMobileMenuOpen = $state(false);
	let langDropdownOpen = $state(false);
	let langDropdownEl: HTMLElement;

	function toggleMobileMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function toggleLangDropdown() {
		langDropdownOpen = !langDropdownOpen;
	}

	function selectLocale(l: string) {
		$locale = l;
		langDropdownOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (langDropdownEl && !langDropdownEl.contains(e.target as Node)) {
			langDropdownOpen = false;
		}
	}

	$effect(() => {
		if (!langDropdownOpen) return;
		const handler = (e: MouseEvent) => handleClickOutside(e);
		document.addEventListener('click', handler, true);
		return () => document.removeEventListener('click', handler, true);
	});

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') langDropdownOpen = false;
	}
</script>

<svelte:window onkeydown={onKeydown} />

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
					href="/contact"
					class="hover:text-zinc-900 dark:hover:text-white transition-colors {page.url.pathname ===
					'/contact'
						? 'text-zinc-900 dark:text-white'
						: ''}">{$t('common.contact')}</a
				>
			</div>

			<div class="flex items-center gap-4">
				<div bind:this={langDropdownEl} class="relative">
					<button
						type="button"
						onclick={toggleLangDropdown}
						aria-expanded={langDropdownOpen}
						aria-haspopup="listbox"
						aria-label="Select language"
						class="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 text-sm font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950 transition-all"
					>
						<Languages class="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
						<span class="min-w-[4.5rem] text-left"
							>{localeNames[$locale ?? 'en'] ?? $locale ?? 'en'}</span
						>
						<ChevronDown
							class="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 {langDropdownOpen
								? 'rotate-180'
								: ''}"
						/>
					</button>
					{#if langDropdownOpen}
						<div
							transition:slide={{ duration: 150 }}
							class="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-50"
							role="listbox"
							aria-label="Language options"
						>
							{#each $locales as l (l)}
								<button
									type="button"
									role="option"
									aria-selected={$locale === l}
									onclick={() => selectLocale(l)}
									class="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors {$locale ===
									l
										? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
										: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'}"
								>
									<span>{localeNames[l] ?? l}</span>
									{#if $locale === l}
										<Check class="w-4 h-4 shrink-0 text-zinc-600 dark:text-zinc-300" />
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
				<div class="hidden md:block">
					<ThemeToggle />
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
					href="/interactive"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname.startsWith(
						'/interactive'
					)
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.interactive')}
				</a>
				<a
					href="/apps"
					onclick={() => (isMobileMenuOpen = false)}
					class="block px-3 py-2 rounded-lg text-base font-medium {page.url.pathname.startsWith(
						'/apps'
					)
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'}"
				>
					{$t('common.apps')}
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
				<div class="flex items-center gap-2 px-3 py-2 md:hidden">
					<ThemeToggle />
				</div>
			</div>
		</div>
	{/if}
</nav>
