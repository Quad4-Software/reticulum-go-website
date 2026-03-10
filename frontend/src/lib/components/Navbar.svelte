<script lang="ts">
	import Logo from './Logo.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { page } from '$app/state';
	import { t, locale, locales } from 'svelte-i18n';
	import { Languages, ChevronDown, Check } from 'lucide-svelte';

	let { currentPath = '/', currentTheme = 'system' } = $props();

	const localeNames: Record<string, string> = {
		en: 'English',
		de: 'Deutsch',
		ru: 'Русский',
		it: 'Italiano'
	};

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

			<div class="flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
				<details class="relative">
					<summary
						aria-label="Select language"
						class="list-none cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 text-sm font-medium shadow-sm hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
					>
						<Languages class="w-4 h-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
						<span class="min-w-[4.5rem] text-left"
							>{localeNames[$locale ?? 'en'] ?? $locale ?? 'en'}</span
						>
						<ChevronDown class="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
					</summary>
					<div
						class="absolute right-0 mt-2 min-w-[11rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-50"
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
								<span>{localeNames[l] ?? l}</span>
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
					class="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
					aria-label="Source Code"
				>
					<img src="/gitea.svg" alt="Gitea" class="w-5 h-5" />
				</a>
			</div>
		</div>
	</div>
</nav>
