<script lang="ts">
	import { onMount } from 'svelte';
	import { getLatestTag, getRepoUpdatedAt, calculateTimeAgo } from '$lib/version';
	import { t } from 'svelte-i18n';
	import { Rss } from 'lucide-svelte';
	import { env } from '$env/dynamic/public';

	const showCoolify = env.PUBLIC_SHOW_COOLIFY === 'true';
	const currentYear = new Date().getFullYear();
	let latestTag = $state<string | null>(null);
	let repoUpdatedAt = $state<string | null>(null);
	let copiedRss = $state<string | null>(null);

	let timeAgo = $derived.by(() => calculateTimeAgo(repoUpdatedAt));

	onMount(async () => {
		const [tag, updatedAt] = await Promise.all([getLatestTag(), getRepoUpdatedAt()]);
		latestTag = tag;
		repoUpdatedAt = updatedAt;
	});

	async function copyRssLink(url: string, type: 'development' | 'releases') {
		try {
			await navigator.clipboard.writeText(url);
			copiedRss = type;
			setTimeout(() => {
				copiedRss = null;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy RSS link:', err);
		}
	}
</script>

<footer
	class="mt-12 border-t border-zinc-200 px-4 pb-[calc(3rem+env(safe-area-inset-bottom,0px))] pt-12 dark:border-zinc-800 sm:mt-20"
>
	<div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
		<div class="space-y-4">
			<div class="flex items-center gap-3">
				<div
					class="flex items-center justify-center w-8 h-8 rounded bg-[#00ADD8] text-white font-bold text-sm"
				>
					R
				</div>
				<span class="font-bold text-lg">Reticulum-Go</span>
			</div>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">
				A Go implementation of the Reticulum Network Stack. Building the future of resilient,
				sovereign communications.
			</p>
			<div class="flex flex-col gap-1">
				<div class="flex items-center gap-3">
					<p class="text-xs text-zinc-400">Implementation License: Apache-2.0</p>
					{#if latestTag}
						<span class="text-zinc-300 dark:text-zinc-700">•</span>
						<a
							href="https://github.com/Quad4-Software/Reticulum-Go/releases/tag/{latestTag}"
							target="_blank"
							rel="noopener noreferrer"
							class="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
						>
							{latestTag}
						</a>
					{/if}
				</div>
				{#if timeAgo}
					<p class="text-xs text-zinc-400">
						{$t('common.last_activity', {
							values: { time: `${timeAgo.value} ${$t(timeAgo.unit)}` }
						})}
					</p>
				{/if}
			</div>
			<div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
				<h4 class="font-semibold mb-2 text-xs text-zinc-400 dark:text-zinc-500">
					Follow Development
				</h4>
				<ul class="space-y-2 text-sm">
					<li>
						<button
							type="button"
							onclick={() =>
								copyRssLink(
									'https://github.com/Quad4-Software/Reticulum-Go/commits/master.atom',
									'development'
								)}
							class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
						>
							<Rss class="w-4 h-4" />
							<span>{$t('common.rss_development')}</span>
							{#if copiedRss === 'development'}
								<span class="text-xs text-[#00ADD8]">{$t('common.rss_copied')}</span>
							{/if}
						</button>
					</li>
					<li>
						<button
							type="button"
							onclick={() =>
								copyRssLink(
									'https://github.com/Quad4-Software/Reticulum-Go/releases.atom',
									'releases'
								)}
							class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
						>
							<Rss class="w-4 h-4" />
							<span>{$t('common.rss_releases')}</span>
							{#if copiedRss === 'releases'}
								<span class="text-xs text-[#00ADD8]">{$t('common.rss_copied')}</span>
							{/if}
						</button>
					</li>
				</ul>
			</div>
		</div>

		<div>
			<h3 class="font-bold mb-4">Links</h3>
			<ul class="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
				<li><a href="/" class="hover:text-zinc-900 dark:hover:text-zinc-100">Home</a></li>
				<li><a href="/docs" class="hover:text-zinc-900 dark:hover:text-zinc-100">Docs</a></li>
				<li><a href="/tools" class="hover:text-zinc-900 dark:hover:text-zinc-100">Tools</a></li>
				<li><a href="/apps" class="hover:text-zinc-900 dark:hover:text-zinc-100">Apps</a></li>
				<li>
					<a
						href="/ren-browser"
						class="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100"
					>
						<span>{$t('common.ren_browser')}</span>
						<span
							class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
							>{$t('ren_browser.badge')}</span
						>
					</a>
				</li>
				<li>
					<a
						href="/wasm-example"
						class="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100"
					>
						<span>WASM Example</span>
						<span
							class="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-orange-500 text-white uppercase"
							>Beta</span
						>
					</a>
				</li>
				<li>
					<a href="/donate" class="hover:text-zinc-900 dark:hover:text-zinc-100"
						>{$t('common.donate')}</a
					>
				</li>
				<li><a href="/contact" class="hover:text-zinc-900 dark:hover:text-zinc-100">Contact</a></li>
				<li>
					<a href="/privacy" class="hover:text-zinc-900 dark:hover:text-zinc-100"
						>{$t('common.privacy')}</a
					>
				</li>
				<li>
					<a
						href="https://github.com/Quad4-Software/Reticulum-Go"
						target="_blank"
						rel="noopener noreferrer"
						class="hover:text-zinc-900 dark:hover:text-zinc-100">Source Code</a
					>
				</li>
			</ul>
		</div>

		<div>
			<h3 class="font-bold mb-4">Quad4 Software</h3>
			<p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
				Backed by Quad4 Software. Building privacy-first, secure, efficient software.
			</p>
			<a
				href="https://quad4.io"
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm font-bold text-[#00ADD8] hover:underline"
			>
				quad4.io
			</a>
		</div>
	</div>

	<div
		class="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-400"
	>
		<div>
			&copy; {currentYear} Quad4 Software. All rights reserved.
		</div>
		{#if showCoolify}
			<div class="flex items-center gap-2">
				<span>Deployed using</span>
				<a
					href="https://coolify.io/"
					target="_blank"
					rel="noopener noreferrer"
					class="hover:opacity-80 transition-opacity"
				>
					<img src="/coolify.svg" alt="Coolify" class="w-4 h-4" />
				</a>
			</div>
		{/if}
	</div>
</footer>
