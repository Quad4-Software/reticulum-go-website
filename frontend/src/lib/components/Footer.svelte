<script lang="ts">
	import { onMount } from 'svelte';
	import { getLatestTag } from '$lib/version';

	const currentYear = new Date().getFullYear();
	let latestTag = $state<string | null>(null);

	onMount(async () => {
		latestTag = await getLatestTag();
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
			<div class="flex items-center gap-3">
				<p class="text-xs text-zinc-400">License: MIT</p>
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
				Backed by Quad4 Software. We build privacy-preserving and decentralised infrastructure.
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
		class="max-w-7xl mx-auto mt-12 pt-8 border-t border-zinc-100 dark:border-zinc-900 text-center text-xs text-zinc-400"
	>
		&copy; {currentYear} Quad4 Software. All rights reserved.
	</div>
</footer>
