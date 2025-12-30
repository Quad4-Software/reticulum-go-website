<script lang="ts">
	import { onMount } from 'svelte';

	let wsUrl = $state('wss://socket.quad4.io/ws');

	onMount(() => {
		const stored = localStorage.getItem('reticulum_ws_url');
		if (stored) wsUrl = stored;
	});

	function saveSettings() {
		localStorage.setItem('reticulum_ws_url', wsUrl);
		alert('Settings saved. Please re-initialize to apply changes.');
	}
</script>

<div class="max-w-2xl mx-auto py-12">
	<h1 class="text-3xl font-bold mb-8 text-center">Settings</h1>

	<div
		class="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-6"
	>
		<div>
			<label
				for="ws-url"
				class="text-sm font-medium text-zinc-500 uppercase tracking-wider block mb-2"
				>Relay Server (WSS)</label
			>
			<input
				id="ws-url"
				type="text"
				bind:value={wsUrl}
				class="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 ring-[#00ADD8] outline-none"
			/>
		</div>

		<button
			onclick={saveSettings}
			class="w-full py-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
		>
			Save Configuration
		</button>
	</div>
</div>
