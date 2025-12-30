<script lang="ts">
	import { onMount } from 'svelte';
	import { reticulum } from '$lib/reticulum.svelte';
	import { loadIdentity, clearIdentity } from '$lib/identity';

	let wsUrl = $state('wss://socket.quad4.io/ws');
	let userName = $state('');
	let loading = $state(false);

	onMount(async () => {
		const identity = await loadIdentity();
		if (identity) {
			userName = localStorage.getItem('reticulum_username') || '';
		}
	});

	async function handleInit() {
		if (reticulum.initialized) return;
		loading = true;
		try {
			const ws = localStorage.getItem('reticulum_ws_url') || wsUrl;
			await reticulum.init(ws, userName);
			localStorage.setItem('reticulum_username', userName);
			await reticulum.connect();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			console.error(message);
		} finally {
			loading = false;
		}
	}

	async function handleClear() {
		if (confirm('Are you sure? This will delete your identity from this device.')) {
			await clearIdentity();
			localStorage.removeItem('reticulum_username');
			window.location.reload();
		}
	}
</script>

<div
	class="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
>
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-lg font-semibold">Network Identity</h2>
		{#if reticulum.connected}
			<span
				class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
			>
				Connected
			</span>
		{:else if reticulum.initialized}
			<span
				class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
			>
				Initialized
			</span>
		{:else}
			<span
				class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400"
			>
				Offline
			</span>
		{/if}
	</div>

	{#if reticulum.identity}
		<div class="space-y-4">
			<div>
				<span class="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1"
					>Identity</span
				>
				<div
					class="font-mono text-sm break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800"
				>
					{reticulum.identity.address}
				</div>
			</div>
			<div>
				<span class="text-xs font-medium text-zinc-500 uppercase tracking-wider block mb-1"
					>Destination Hash</span
				>
				<div
					class="font-mono text-xs break-all p-2 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 line-clamp-2"
				>
					{reticulum.identity.publicKey}
				</div>
			</div>

			{#if !reticulum.connected}
				<button
					onclick={() => reticulum.connect()}
					class="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors"
				>
					Reconnect
				</button>
			{/if}

			<div class="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
				<button
					onclick={handleClear}
					class="flex-1 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/50 transition-colors"
				>
					Clear Identity
				</button>
			</div>
		</div>
	{:else}
		<div class="space-y-4">
			<div>
				<label for="username" class="text-xs font-medium text-zinc-500 uppercase tracking-wider"
					>Display Name</label
				>
				<input
					id="username"
					type="text"
					bind:value={userName}
					placeholder="Enter your name"
					class="mt-1 w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 ring-zinc-500 outline-none"
				/>
			</div>
			<div>
				<label for="wsurl" class="text-xs font-medium text-zinc-500 uppercase tracking-wider"
					>Relay Server</label
				>
				<input
					id="wsurl"
					type="text"
					bind:value={wsUrl}
					placeholder="wss://..."
					class="mt-1 w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 ring-zinc-500 outline-none"
				/>
			</div>

			<button
				onclick={handleInit}
				disabled={loading || !wsUrl}
				class="w-full px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50"
			>
				{loading ? 'Initializing...' : 'Join Network'}
			</button>
		</div>
	{/if}
</div>
