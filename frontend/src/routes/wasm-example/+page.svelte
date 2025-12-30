<script lang="ts">
	import IdentityCard from '$lib/components/IdentityCard.svelte';
	import { reticulum } from '$lib/reticulum.svelte';
	import { onMount } from 'svelte';

	let messageInput = $state('');
	let showToast = $state(false);
	let toastMessage = $state('');

	onMount(async () => {
		await reticulum.ensureWasmLoaded();
	});

	const peers = $derived(Array.from(reticulum.peers.values()));
	const currentMessages = $derived(
		(reticulum.selectedPeerHash ? reticulum.messages.get(reticulum.selectedPeerHash) : null) || []
	);

	async function handleAnnounce() {
		try {
			await reticulum.announce(localStorage.getItem('reticulum_username') || '');
			triggerToast('Announce sent successfully');
		} catch (e) {
			console.error(e);
		}
	}

	function triggerToast(msg: string) {
		toastMessage = msg;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	async function sendMessage() {
		if (!messageInput.trim() || !reticulum.selectedPeerHash) return;
		try {
			await reticulum.sendMessage(reticulum.selectedPeerHash, messageInput);
			messageInput = '';
		} catch (e) {
			console.error(e);
		}
	}

	function formatBytes(bytes: number) {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		const index = Math.max(0, Math.min(i, sizes.length - 1));
		const sizeLabel = sizes[index] || 'B';
		return parseFloat((bytes / Math.pow(k, index)).toFixed(1)) + ' ' + sizeLabel;
	}
</script>

<div class="grid lg:grid-cols-12 gap-8 relative">
	<div class="lg:col-span-8 space-y-8">
		<section>
			<h1 class="text-4xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-zinc-50">
				WASM Chat Example
			</h1>
			<p class="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
				Reticulum-Go running in your browser using websockets as transport medium.
			</p>

			{#if reticulum.isLoading}
				<div
					class="mt-8 flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-pulse"
				>
					<div
						class="w-5 h-5 border-2 border-[#00ADD8] border-t-transparent rounded-full animate-spin"
					></div>
					<span class="text-sm font-medium text-zinc-600 dark:text-zinc-400"
						>Loading Reticulum WASM...</span
					>
				</div>
			{:else if reticulum.error}
				<div
					class="mt-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400"
				>
					<div class="flex items-center gap-2 font-bold mb-1">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
								x1="12"
								y1="16"
								x2="12.01"
								y2="16"
							/></svg
						>
						WASM Error
					</div>
					<p class="text-sm">{reticulum.error}</p>
				</div>
			{/if}

			<div
				class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500"
			>
				<div class="flex gap-2">
					<span>Packets:</span>
					<span class="text-zinc-900 dark:text-zinc-100"
						>{reticulum.stats.packetsSent}↑ {reticulum.stats.packetsReceived}↓</span
					>
				</div>
				<div class="flex gap-2">
					<span>Data:</span>
					<span class="text-zinc-900 dark:text-zinc-100"
						>{formatBytes(reticulum.stats.bytesSent)}↑ {formatBytes(
							reticulum.stats.bytesReceived
						)}↓</span
					>
				</div>
			</div>
		</section>

		{#if reticulum.connected}
			<section class="border-t border-zinc-200 dark:border-zinc-800 pt-8">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-2xl font-bold">Network Peers</h2>
					<button
						onclick={handleAnnounce}
						class="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
					>
						Announce Myself
					</button>
				</div>

				<div class="grid md:grid-cols-2 gap-8">
					<!-- Peer List -->
					<div class="space-y-2 max-h-[400px] overflow-y-auto pr-2">
						{#if peers.length === 0}
							<div
								class="text-center py-12 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-xl text-zinc-500"
							>
								Searching for peers...
							</div>
						{:else}
							{#each peers as peer (peer.hash)}
								<button
									onclick={() => (reticulum.selectedPeerHash = peer.hash)}
									class="w-full text-left p-4 rounded-xl border transition-all {reticulum.selectedPeerHash ===
									peer.hash
										? 'border-zinc-900 dark:border-white ring-1 ring-zinc-900 dark:ring-white bg-zinc-50 dark:bg-zinc-900 shadow-md'
										: 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'}"
								>
									<div class="font-bold">{peer.name}</div>
									<div class="flex items-center gap-3 mt-1 text-xs text-zinc-500">
										<span class="font-mono">{peer.hash.substring(0, 12)}...</span>
										<span>•</span>
										<span>{peer.hops} {peer.hops === 1 ? 'hop' : 'hops'}</span>
									</div>
								</button>
							{/each}
						{/if}
					</div>

					<!-- Chat Area -->
					<div
						class="flex flex-col h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm"
					>
						{#if !reticulum.selectedPeerHash}
							<div
								class="flex-1 flex items-center justify-center p-8 text-center text-zinc-500 text-sm"
							>
								Select a peer to start messaging
							</div>
						{:else}
							<div
								class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center"
							>
								<span class="font-bold text-sm"
									>{reticulum.peers.get(reticulum.selectedPeerHash)?.name}</span
								>
								<span class="text-[10px] font-mono opacity-50"
									>{reticulum.selectedPeerHash.substring(0, 16)}...</span
								>
							</div>

							<div class="flex-1 overflow-y-auto p-4 space-y-4">
								{#each currentMessages as msg, i (i)}
									<div class="flex flex-col {msg.type === 'sent' ? 'items-end' : 'items-start'}">
										<div
											class="max-w-[85%] p-3 rounded-2xl text-sm {msg.type === 'sent'
												? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none'
												: 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-none'}"
										>
											{msg.text}
										</div>
										<span class="text-[10px] text-zinc-500 mt-1"
											>{msg.time.toLocaleTimeString([], {
												hour: '2-digit',
												minute: '2-digit'
											})}</span
										>
									</div>
								{/each}
							</div>

							<form
								onsubmit={(e) => {
									e.preventDefault();
									sendMessage();
								}}
								class="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
							>
								<input
									type="text"
									bind:value={messageInput}
									placeholder="Enter message..."
									class="flex-1 bg-zinc-50 dark:bg-zinc-900 border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 ring-[#00ADD8]"
								/>
								<button
									type="submit"
									disabled={!messageInput.trim()}
									class="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-all active:scale-95"
								>
									Send
								</button>
							</form>
						{/if}
					</div>
				</div>
			</section>
		{/if}

		<section class="border-t border-zinc-200 dark:border-zinc-800 pt-8">
			<h2 class="text-2xl font-bold mb-4">System Console</h2>
			<div
				class="bg-zinc-950 rounded-xl p-4 font-mono text-xs text-zinc-400 h-48 overflow-y-auto space-y-1 border border-zinc-800 shadow-inner"
			>
				{#each reticulum.logs as log, i (i)}
					<div class="flex gap-2">
						<span class="text-zinc-600">[{log.time}]</span>
						<span
							class={log.type === 'error'
								? 'text-red-500'
								: log.type === 'success'
									? 'text-green-500'
									: 'text-zinc-300'}
						>
							{log.msg}
						</span>
					</div>
				{/each}
				{#if reticulum.logs.length === 0}
					<div class="opacity-30 italic">Waiting for system messages...</div>
				{/if}
			</div>
		</section>
	</div>

	<div class="lg:col-span-4">
		<div class="sticky top-24">
			<IdentityCard />
		</div>
	</div>

	{#if showToast}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#00ADD8] text-white font-bold rounded-full shadow-lg animate-bounce"
		>
			{toastMessage}
		</div>
	{/if}
</div>
