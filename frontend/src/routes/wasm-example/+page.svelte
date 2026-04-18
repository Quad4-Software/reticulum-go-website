<script lang="ts">
	import IdentityCard from '$lib/components/IdentityCard.svelte';
	import { reticulum } from '$lib/reticulum.svelte';
	import { onMount } from 'svelte';

	let messageInput = $state('');
	let searchQuery = $state('');
	let manualHash = $state('');
	let showToast = $state(false);
	let toastMessage = $state('');
	let scrollContainer = $state<HTMLDivElement | null>(null);
	let showManualEntry = $state(false);

	onMount(async () => {
		await reticulum.ensureWasmLoaded();
	});

	$effect(() => {
		if (currentMessages && scrollContainer) {
			scrollContainer.scrollTo({
				top: scrollContainer.scrollHeight,
				behavior: 'smooth'
			});
		}
	});

	const peers = $derived.by(() => {
		void reticulum.peersVersion;
		void reticulum.unreadCountsVersion;
		void reticulum.peerKeyStatusVersion;
		return Array.from(reticulum.peers.values())
			.filter(
				(p) =>
					p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					p.hash.toLowerCase().includes(searchQuery.toLowerCase())
			)
			.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
	});
	const currentMessages = $derived.by(() => {
		void reticulum.messagesVersion;
		return (
			(reticulum.selectedPeerHash ? reticulum.messages.get(reticulum.selectedPeerHash) : null) || []
		);
	});

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

	function handleManualPeer() {
		const hash = manualHash.trim().toLowerCase();
		if (hash.length !== 32) {
			triggerToast('Hash must be exactly 32 hex characters');
			return;
		}
		if (!/^[0-9a-f]+$/.test(hash)) {
			triggerToast('Invalid hex characters');
			return;
		}

		if (!reticulum.peers.has(hash)) {
			reticulum.peers.set(hash, {
				hash: hash,
				name: `Manual: ${hash.substring(0, 8)}`,
				hops: 0,
				lastSeen: new Date()
			});
			reticulum.peersVersion++;
			reticulum.peerKeyStatus.set(hash, 'unknown');
			reticulum.peerKeyStatusVersion++;
		}

		reticulum.selectedPeerHash = hash;
		manualHash = '';
		showManualEntry = false;
		triggerToast('Peer added manually');
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

	function formatTime(date: Date) {
		if (!date) return 'N/A';
		return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}
</script>

<div class="grid lg:grid-cols-12 xl:grid-cols-10 2xl:grid-cols-12 gap-8 relative">
	<div class="lg:col-span-8 xl:col-span-7 2xl:col-span-9 space-y-4">
		<section class="pb-2">
			<div class="flex items-center gap-4 mb-2">
				<div class="p-2.5 bg-[#00ADD8] rounded-2xl shadow-md shadow-[#00ADD8]/10 text-white">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="w-6 h-6"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg
					>
				</div>
				<div>
					<div class="flex items-center gap-3">
						<h1 class="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
							WASM Chat
						</h1>
						<span
							class="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg"
						>
							Beta
						</span>
					</div>
					<p class="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
						Secure P2P messaging via Reticulum-Go
					</p>
				</div>
			</div>

			{#if reticulum.isLoading}
				<div
					class="mt-8 p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4"
				>
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
						<div class="flex-1 space-y-2">
							<div class="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
							<div class="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="h-3 w-full rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
						<div class="h-3 w-4/5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
					</div>
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

			<div class="flex flex-wrap gap-3 mt-4">
				<div
					class="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
				>
					<span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block"
						>Packets</span
					>
					<div class="flex items-center gap-2">
						<span class="text-[11px] font-bold text-green-500 flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-2.5 h-2.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="m19 12-7 7-7-7" /><path d="M12 19V5" /></svg
							>
							{reticulum.stats.packetsReceived}
						</span>
						<span class="text-[11px] font-bold text-[#00ADD8] flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-2.5 h-2.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg
							>
							{reticulum.stats.packetsSent}
						</span>
					</div>
				</div>
				<div
					class="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
				>
					<span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block"
						>Traffic</span
					>
					<div
						class="flex items-center gap-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300"
					>
						<span>{formatBytes(reticulum.stats.bytesReceived)} ↓</span>
						<span>{formatBytes(reticulum.stats.bytesSent)} ↑</span>
					</div>
				</div>
				<div
					class="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
				>
					<span class="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block"
						>Announces</span
					>
					<div class="flex items-center gap-2">
						<span class="text-[11px] font-bold text-green-500 flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-2.5 h-2.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="m19 12-7 7-7-7" /><path d="M12 19V5" /></svg
							>
							{reticulum.stats.announcesReceived}
						</span>
						<span class="text-[11px] font-bold text-[#00ADD8] flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-2.5 h-2.5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg
							>
							{reticulum.stats.announcesSent}
						</span>
					</div>
				</div>
			</div>
		</section>

		{#if reticulum.initialized}
			<section class="border-t border-zinc-200 dark:border-zinc-800 pt-6">
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
					<div>
						<h2 class="text-2xl font-black text-zinc-900 dark:text-zinc-50">Network Peers</h2>
					</div>
					<div
						class="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800"
					>
						{#if typeof Notification !== 'undefined'}
							<button
								onclick={() => reticulum.requestNotificationPermission()}
								class="flex items-center gap-2 px-2 hover:opacity-80 transition-opacity"
								title={reticulum.notificationsEnabled
									? 'Notifications Enabled'
									: 'Request Notification Permission'}
							>
								<div class="relative flex items-center">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="w-4 h-4 {reticulum.notificationsEnabled
											? 'text-[#00ADD8]'
											: 'text-zinc-400'}"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
										<path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
									</svg>
									{#if !reticulum.notificationsEnabled}
										<div
											class="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border border-zinc-50 dark:border-zinc-900"
										></div>
									{/if}
								</div>
								<span
									class="text-[11px] font-bold {reticulum.notificationsEnabled
										? 'text-zinc-700 dark:text-zinc-300'
										: 'text-zinc-500'}"
								>
									{reticulum.notificationsEnabled ? 'Alerts On' : 'Enable Alerts'}
								</span>
							</button>
							<div class="w-px h-5 bg-zinc-200 dark:border-zinc-800"></div>
						{/if}

						<button
							onclick={() => {
								if (
									confirm(
										'Are you sure you want to reset all local data? This will clear your identity, messages, and contacts.'
									)
								) {
									reticulum.resetAppData();
								}
							}}
							class="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-500 transition-colors rounded-xl"
							title="Reset Application Data"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-4 h-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M3 6h18" />
								<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
								<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
							</svg>
						</button>
						<div class="w-px h-5 bg-zinc-200 dark:border-zinc-800"></div>

						<label class="flex items-center gap-2 cursor-pointer group px-2">
							<div class="relative">
								<input
									type="checkbox"
									class="sr-only peer"
									bind:checked={reticulum.autoAnnounce}
									onchange={(e) =>
										reticulum.toggleAutoAnnounce(
											e.currentTarget.checked,
											localStorage.getItem('reticulum_username') || ''
										)}
								/>
								<div
									class="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#00ADD8]"
								></div>
							</div>
							<span
								class="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors"
								>Auto-Announce</span
							>
						</label>
						<div class="w-px h-5 bg-zinc-200 dark:border-zinc-800"></div>
						<button
							onclick={handleAnnounce}
							class="text-[11px] font-bold px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-[#00ADD8] hover:text-[#00ADD8] transition-all"
						>
							Announce
						</button>
					</div>
				</div>

				<div class="grid lg:grid-cols-3 gap-6">
					<!-- Peer List -->
					<div class="flex flex-col gap-4 lg:h-[500px] xl:h-[550px] 2xl:h-[600px]">
						<div class="flex gap-2">
							<div class="relative flex-1">
								<input
									type="text"
									bind:value={searchQuery}
									placeholder="search peers ({reticulum.peers.size})"
									class="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-1 ring-[#00ADD8] outline-none"
								/>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
								>
							</div>
							<button
								onclick={() => (showManualEntry = !showManualEntry)}
								class="p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-[#00ADD8] transition-colors group"
								title="Add peer manually"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="w-5 h-5 text-zinc-400 group-hover:text-[#00ADD8]"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle
										cx="9"
										cy="7"
										r="4"
									/><line x1="19" y1="8" x2="19" y2="14" /><line
										x1="22"
										y1="11"
										x2="16"
										y2="11"
									/></svg
								>
							</button>
						</div>

						{#if showManualEntry}
							<div
								class="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
							>
								<div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
									Manual Peer Hash
								</div>
								<div class="flex gap-2">
									<input
										type="text"
										bind:value={manualHash}
										placeholder="fcff5e64a3ea4edad1d03093fc8fe07f"
										class="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono outline-none focus:ring-1 ring-[#00ADD8]"
									/>
									<button
										onclick={handleManualPeer}
										class="px-3 py-1.5 bg-[#00ADD8] text-white text-[10px] font-bold rounded-lg shadow-sm shadow-[#00ADD8]/20"
									>
										Add
									</button>
								</div>
							</div>
						{/if}

						<div class="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
							{#if peers.length === 0}
								<div
									class="text-center py-10 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-xl text-zinc-500 text-sm"
								>
									{searchQuery ? 'No peers match your search' : 'Searching for peers...'}
								</div>
							{:else}
								{#each peers as peer (peer.hash)}
									<button
										onclick={() => {
											reticulum.selectedPeerHash = peer.hash;
											reticulum.unreadCounts.delete(peer.hash);
											reticulum.unreadCountsVersion++;
										}}
										class="w-full text-left p-3.5 rounded-2xl border transition-all {reticulum.selectedPeerHash ===
										peer.hash
											? 'border-[#00ADD8] bg-[#00ADD8]/5 dark:bg-[#00ADD8]/10 ring-1 ring-[#00ADD8] shadow-md shadow-[#00ADD8]/5'
											: 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'}"
									>
										<div class="flex justify-between items-start mb-1">
											<div class="flex items-center gap-2 min-w-0">
												<div
													class="font-bold text-sm truncate {reticulum.selectedPeerHash ===
													peer.hash
														? 'text-[#00ADD8]'
														: 'text-zinc-900 dark:text-zinc-100'}"
												>
													{peer.name}
												</div>
												{#if reticulum.unreadCounts.has(peer.hash)}
													<span
														class="flex-shrink-0 px-1.5 py-0.5 text-[9px] font-black bg-[#00ADD8] text-white rounded-full leading-none min-w-[1.2rem] h-[1.2rem] flex items-center justify-center shadow-sm shadow-[#00ADD8]/20 animate-in zoom-in duration-200"
													>
														{reticulum.unreadCounts.get(peer.hash)}
													</span>
												{/if}
											</div>
											<div class="text-[10px] font-bold text-zinc-400 whitespace-nowrap">
												{formatTime(peer.lastSeen)}
											</div>
										</div>
										<div
											class="flex items-center justify-between text-[11px] font-medium text-zinc-500"
										>
											<span class="font-mono opacity-60">{peer.hash.substring(0, 10)}...</span>
											<span class="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md"
												>{peer.hops === 0
													? 'unknown'
													: `${peer.hops} ${peer.hops === 1 ? 'hop' : 'hops'}`}</span
											>
										</div>
									</button>
								{/each}
							{/if}
						</div>
					</div>

					<!-- Chat Area -->
					<div
						class="lg:col-span-2 flex flex-col h-[450px] lg:h-[500px] xl:h-[550px] 2xl:h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden shadow-sm"
					>
						{#if !reticulum.selectedPeerHash}
							<div
								class="flex-1 flex items-center justify-center p-8 text-center text-zinc-500 text-sm"
							>
								Select a peer to start messaging
							</div>
						{:else}
							<div
								class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center shadow-sm z-10"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[#00ADD8]"
									>
										{reticulum.peers.get(reticulum.selectedPeerHash)?.name[0].toUpperCase()}
									</div>
									<div>
										<div class="font-bold text-sm text-zinc-900 dark:text-zinc-50">
											{reticulum.peers.get(reticulum.selectedPeerHash)?.name}
										</div>
										<div class="text-[10px] font-mono text-zinc-400">
											{reticulum.selectedPeerHash}
										</div>
									</div>
								</div>
							</div>

							<div
								bind:this={scrollContainer}
								class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/20"
							>
								{#each currentMessages as msg, i (i)}
									<div class="flex flex-col {msg.type === 'sent' ? 'items-end' : 'items-start'}">
										<div
											class="max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm {msg.type ===
											'sent'
												? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none'
												: 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-tl-none'}"
										>
											{msg.text}
										</div>
										<div class="flex items-center gap-2 mt-2 px-1">
											<span class="text-[10px] font-medium text-zinc-400"
												>{msg.time.toLocaleTimeString([], {
													hour: '2-digit',
													minute: '2-digit'
												})}</span
											>
											{#if msg.type === 'sent'}
												<button
													onclick={() =>
														triggerToast(
															`Stats: ${reticulum.stats.packetsSent} sent, ${reticulum.stats.packetsReceived} received`
														)}
													class="hover:scale-110 transition-transform"
													title="Click for stats"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														class="w-3 h-3 text-[#00ADD8]"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="3"
														stroke-linecap="round"
														stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
													>
												</button>
											{/if}
										</div>
									</div>
								{/each}
							</div>

							{#if reticulum.selectedPeerHash && reticulum.peerKeyStatus.get(reticulum.selectedPeerHash) === 'unknown'}
								<div
									class="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-4"
								>
									<div class="flex items-center gap-3 text-amber-700 dark:text-amber-400">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
											><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
												d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
											/></svg
										>
										<div class="text-xs font-bold">
											Keys unknown for this peer. Please wait for an announce or try to fetch them.
										</div>
									</div>
									<button
										onclick={async () => {
											try {
												await reticulum.fetchKeys(reticulum.selectedPeerHash);
												triggerToast('Path request sent to network...');

												setTimeout(() => {
													if (
														reticulum.peerKeyStatus.get(reticulum.selectedPeerHash) === 'fetching'
													) {
														reticulum.peerKeyStatus.set(reticulum.selectedPeerHash, 'unknown');
														reticulum.peerKeyStatusVersion++;
														triggerToast('Key fetch timed out. Waiting for peer announce.');
													}
												}, 30000);
											} catch (e) {
												triggerToast('Failed to request keys');
												console.error(e);
											}
										}}
										class="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
									>
										Fetch Keys
									</button>
								</div>
							{:else if reticulum.selectedPeerHash && reticulum.peerKeyStatus.get(reticulum.selectedPeerHash) === 'fetching'}
								<div
									class="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-900/50 flex items-center gap-3 text-blue-700 dark:text-blue-400"
								>
									<div
										class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
									></div>
									<div class="text-xs font-bold">Attempting to fetch keys from network...</div>
								</div>
							{/if}

							<form
								onsubmit={(e) => {
									e.preventDefault();
									sendMessage();
								}}
								class="p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-3"
							>
								<input
									type="text"
									bind:value={messageInput}
									placeholder={reticulum.selectedPeerHash === 'unknown'
										? 'Cannot reply to unknown sender'
										: 'Type a message...'}
									disabled={reticulum.selectedPeerHash === 'unknown'}
									class="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-[#00ADD8]/20 focus:border-[#00ADD8] transition-all disabled:opacity-50"
								/>
								<button
									type="submit"
									disabled={!messageInput.trim() || reticulum.selectedPeerHash === 'unknown'}
									class="px-6 py-3 bg-[#00ADD8] hover:bg-[#009dc4] text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-all active:scale-95 shadow-md shadow-[#00ADD8]/10"
								>
									Send
								</button>
							</form>
						{/if}
					</div>
				</div>
			</section>
		{/if}

		<section class="border-t border-zinc-200 dark:border-zinc-800 pt-8 pb-12">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-xl font-black text-zinc-900 dark:text-zinc-50">System Logs</h2>
				</div>
				<button
					onclick={() => (reticulum.logs = [])}
					class="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-500 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-red-500/50 transition-all"
				>
					Clear
				</button>
			</div>
			<div
				class="bg-zinc-100 dark:bg-zinc-950 rounded-2xl p-3 font-mono text-[10px] text-zinc-700 dark:text-zinc-400 h-32 overflow-y-auto space-y-1 border border-zinc-200 dark:border-zinc-800 shadow-inner custom-scrollbar"
			>
				{#each reticulum.logs as log, i (i)}
					<div class="flex gap-2">
						<span class="text-zinc-500 dark:text-zinc-600">[{log.time}]</span>
						<span
							class={log.type === 'error'
								? 'text-red-500'
								: log.type === 'success'
									? 'text-green-500'
									: 'text-zinc-700 dark:text-zinc-300'}
						>
							{log.msg}
						</span>
					</div>
				{/each}
				{#if reticulum.logs.length === 0}
					<div class="opacity-30 italic">Waiting for system messages...</div>
				{/if}
			</div>
			<div class="mt-2 text-[10px] text-zinc-500 dark:text-zinc-600">
				Check F12 Console for detailed logs.
			</div>
		</section>
	</div>

	<div class="lg:col-span-4 xl:col-span-3 2xl:col-span-3">
		<div class="sticky top-24">
			<IdentityCard />
		</div>
	</div>

	{#if showToast}
		<div
			class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#00ADD8]/90 backdrop-blur-sm text-white font-bold rounded-full shadow-lg"
		>
			{toastMessage}
		</div>
	{/if}
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 6px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: #d4d4d8;
		border-radius: 10px;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background: #3f3f46;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #a1a1aa;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
