<script lang="ts">
	import { onMount } from 'svelte';
	import { getLatestTag, calculateTimeAgo } from '$lib/version';
	import { t } from 'svelte-i18n';

	const showCoolify = import.meta.env.PUBLIC_SHOW_COOLIFY === 'true';
	const currentYear = new Date().getFullYear();
	let latestTag = $state<string | null>(null);
	let repoUpdatedAt = $state<string | null>(null);

	let timeAgo = $derived.by(() => calculateTimeAgo(repoUpdatedAt));

	onMount(async () => {
		latestTag = await getLatestTag();
		try {
			const res = await fetch('https://git.quad4.io/api/v1/repos/Networks/Reticulum-Go');
			if (res.ok) {
				const data = await res.json();
				if (data.updated_at) {
					repoUpdatedAt = data.updated_at;
				}
			}
		} catch (e) {
			console.error('Failed to fetch repo stats:', e);
		}
	});
</script>

<footer class="mt-20 border-t border-zinc-200 dark:border-zinc-800 py-12 px-4">
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
					<p class="text-xs text-zinc-400">License: 0BSD</p>
					{#if latestTag}
						<span class="text-zinc-300 dark:text-zinc-700">•</span>
						<a
							href="https://git.quad4.io/Networks/Reticulum-Go/releases/tag/{latestTag}"
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
		</div>

		<div>
			<h3 class="font-bold mb-4">Links</h3>
			<ul class="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
				<li><a href="/" class="hover:text-zinc-900 dark:hover:text-zinc-100">Home</a></li>
				<li>
					<a href="/wasm-example" class="hover:text-zinc-900 dark:hover:text-zinc-100"
						>WASM Example</a
					>
				</li>
				<li><a href="/donate" class="hover:text-zinc-900 dark:hover:text-zinc-100">Donate</a></li>
				<li><a href="/contact" class="hover:text-zinc-900 dark:hover:text-zinc-100">Contact</a></li>
				<li>
					<a
						href="https://git.quad4.io/Networks/Reticulum-Go"
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
