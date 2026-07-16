<script lang="ts">
	import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { TutorialInteractiveId } from '$lib/tutorials/types';
	import {
		DESTINATION_RULES,
		evaluateHopLimit,
		CRYPTO_PIPELINE,
		buildAnnounceReplay,
		LINK_STAGES,
		INTERFACE_CARDS,
		PATHFINDER_M,
		PACKET_SIM_NODES,
		stepPacketSim,
		LINK_SIM_FRAMES,
		type DestinationKind,
		type InterfaceKind,
		type PacketSimMode,
		type PacketSimState
	} from '$lib/tutorials/interactive';

	let {
		kind,
		tryIt: _tryIt
	}: {
		kind: TutorialInteractiveId;
		tryIt?: string;
	} = $props();

	const destinationKinds: DestinationKind[] = ['single', 'plain', 'group', 'link'];
	let activeDestination = $state<DestinationKind>('single');
	const activeRule = $derived(DESTINATION_RULES[activeDestination]);

	let hops = $state(64);
	const hopOutcome = $derived(evaluateHopLimit(hops));

	let cryptoIndex = $state(0);
	const cryptoStage = $derived(CRYPTO_PIPELINE[cryptoIndex]);
	const isFirstStage = $derived(cryptoIndex === 0);
	const isLastStage = $derived(cryptoIndex === CRYPTO_PIPELINE.length - 1);

	function nextStage() {
		if (!isLastStage) cryptoIndex += 1;
	}
	function prevStage() {
		if (!isFirstStage) cryptoIndex -= 1;
	}

	const announceFrames = buildAnnounceReplay();
	let announceIndex = $state(0);
	const announceFrame = $derived(announceFrames[announceIndex]);
	const isFirstFrame = $derived(announceIndex === 0);
	const isLastFrame = $derived(announceIndex === announceFrames.length - 1);

	function nextFrame() {
		if (!isLastFrame) announceIndex += 1;
	}
	function prevFrame() {
		if (!isFirstFrame) announceIndex -= 1;
	}

	let linkIndex = $state(0);
	const linkStage = $derived(LINK_STAGES[linkIndex]);
	const isFirstLink = $derived(linkIndex === 0);
	const isLastLink = $derived(linkIndex === LINK_STAGES.length - 1);

	function nextLink() {
		if (!isLastLink) linkIndex += 1;
	}
	function prevLink() {
		if (!isFirstLink) linkIndex -= 1;
	}

	const interfaceKinds: InterfaceKind[] = ['lora', 'tcp', 'udp', 'serial', 'websocket'];
	let activeInterface = $state<InterfaceKind>('tcp');
	const activeInterfaceCard = $derived(INTERFACE_CARDS[activeInterface]);

	const packetModes: PacketSimMode[] = ['encrypted', 'plain'];
	let packetMode = $state<PacketSimMode>('encrypted');
	let packetNode = $state(0);
	let packetHops = $state(0);
	let packetStatus = $state<PacketSimState['status']>('moving');
	let packetDetail = $state(
		'Encrypted SINGLE traffic can traverse multiple hops toward a matching destination.'
	);
	const packetFinished = $derived(packetStatus !== 'moving');

	function resetPacketSim() {
		packetMode = 'encrypted';
		packetNode = 0;
		packetHops = 0;
		packetStatus = 'moving';
		packetDetail =
			'Encrypted SINGLE traffic can traverse multiple hops toward a matching destination.';
	}

	function stepPacket() {
		const next = stepPacketSim(packetMode, packetNode, packetHops);
		packetNode = next.nodeIndex;
		packetHops = next.hops;
		packetStatus = next.status;
		packetDetail = next.detail;
	}

	function setPacketMode(mode: PacketSimMode) {
		packetMode = mode;
		packetNode = 0;
		packetHops = 0;
		packetStatus = 'moving';
		packetDetail =
			mode === 'plain'
				? 'PLAIN destinations stay local. Play one hop to see the rule.'
				: 'Encrypted SINGLE traffic can traverse multiple hops toward a matching destination.';
	}

	let linkSimIndex = $state(0);
	const linkSimFrame = $derived(LINK_SIM_FRAMES[linkSimIndex]);
	const isFirstLinkSim = $derived(linkSimIndex === 0);
	const isLastLinkSim = $derived(linkSimIndex === LINK_SIM_FRAMES.length - 1);
	const linkSimActive = $derived(linkSimFrame.from !== 'both');

	function resetLinkSim() {
		linkSimIndex = 0;
	}

	function nextLinkSim() {
		if (!isLastLinkSim) linkSimIndex += 1;
	}

	function prevLinkSim() {
		if (!isFirstLinkSim) linkSimIndex -= 1;
	}
</script>

<div
	class="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
>
	{#if kind === 'destination-type'}
		<div class="flex flex-wrap gap-2">
			{#each destinationKinds as destKind (destKind)}
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {activeDestination ===
					destKind
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={activeDestination === destKind}
					onclick={() => (activeDestination = destKind)}
				>
					{DESTINATION_RULES[destKind].label}
				</button>
			{/each}
		</div>

		<div
			class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
		>
			<div class="flex flex-wrap gap-2">
				{#if activeRule.encrypted}
					<span
						class="rounded-full bg-[#00ADD8]/10 px-2.5 py-1 text-xs font-semibold text-[#00ADD8]"
					>
						{$t('tools.reticulum_guide.encrypted')}
					</span>
				{/if}
				<span
					class="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
				>
					{activeRule.multiHop
						? $t('tools.reticulum_guide.multi_hop')
						: $t('tools.reticulum_guide.local_only')}
				</span>
			</div>
			<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{activeRule.detail}</p>
		</div>
	{:else if kind === 'hop-limit'}
		<div class="space-y-3">
			<input
				type="range"
				min="0"
				max="140"
				bind:value={hops}
				class="w-full accent-[#00ADD8]"
				aria-label="Hop count"
			/>
			<div class="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
				<span>Hops: {hopOutcome.hops}</span>
				<span
					class="rounded-full px-2.5 py-1 text-xs font-semibold {hopOutcome.accepted
						? 'bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'bg-red-500/10 text-red-500'}"
				>
					{hopOutcome.accepted
						? $t('tools.reticulum_guide.accepted')
						: $t('tools.reticulum_guide.rejected')}
				</span>
			</div>
			<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{hopOutcome.reason}</p>
		</div>
	{:else if kind === 'crypto-pipeline'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each CRYPTO_PIPELINE as stage, index (stage.id)}
					<span
						class="h-2 w-2 rounded-full {index === cryptoIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{cryptoStage.label}</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{cryptoStage.detail}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
					disabled={isFirstStage}
					onclick={prevStage}
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isLastStage}
					onclick={nextStage}
				>
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{:else if kind === 'announce-replay'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each announceFrames as frame (frame.hop)}
					<span
						class="h-2 w-2 rounded-full {frame.hop === announceFrame.hop
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
					Hop {announceFrame.hop}
				</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{announceFrame.action}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
					disabled={isFirstFrame}
					onclick={prevFrame}
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isLastFrame}
					onclick={nextFrame}
				>
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{:else if kind === 'link-stages'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each LINK_STAGES as stage, index (stage.id)}
					<span
						class="h-2 w-2 rounded-full {index === linkIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{linkStage.label}</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{linkStage.detail}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
					disabled={isFirstLink}
					onclick={prevLink}
				>
					<ChevronLeft class="h-4 w-4" />
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={isLastLink}
					onclick={nextLink}
				>
					<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>
	{:else if kind === 'interface-pick'}
		<div class="flex flex-wrap gap-2">
			{#each interfaceKinds as iface (iface)}
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors {activeInterface ===
					iface
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={activeInterface === iface}
					onclick={() => (activeInterface = iface)}
				>
					{INTERFACE_CARDS[iface].label}
				</button>
			{/each}
		</div>
		<div
			class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
		>
			<span
				class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold {activeInterfaceCard.inGo
					? 'bg-[#00ADD8]/10 text-[#00ADD8]'
					: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}"
			>
				{activeInterfaceCard.inGo
					? $t('tools.reticulum_guide.in_go')
					: $t('tools.reticulum_guide.python_ref')}
			</span>
			<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
				{activeInterfaceCard.detail}
			</p>
		</div>
	{:else if kind === 'packet-sim'}
		<div class="space-y-3">
			<div class="flex flex-wrap gap-2">
				{#each packetModes as mode (mode)}
					<button
						type="button"
						class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {packetMode ===
						mode
							? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
							: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
						aria-pressed={packetMode === mode}
						onclick={() => setPacketMode(mode)}
					>
						{mode === 'encrypted' ? 'Encrypted' : 'Plain'}
					</button>
				{/each}
			</div>

			<div class="flex items-center justify-center gap-2 sm:gap-3">
				{#each PACKET_SIM_NODES as node, index (node.id)}
					{#if index > 0}
						<span
							class="h-px w-4 sm:w-6 {index <= packetNode && packetStatus !== 'local-only'
								? 'bg-[#00ADD8]'
								: 'bg-zinc-300 dark:bg-zinc-700'}"
						></span>
					{/if}
					<span
						class="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors sm:h-10 sm:w-10 {index ===
						packetNode
							? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
							: 'border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400'}"
					>
						{node.label}
					</span>
				{/each}
			</div>

			<div class="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
				<span>Hops: {packetHops}</span>
				<span
					class="rounded-full px-2.5 py-1 text-xs font-semibold {packetStatus === 'moving'
						? 'bg-[#00ADD8]/10 text-[#00ADD8]'
						: packetStatus === 'delivered'
							? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
							: packetStatus === 'local-only'
								? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
								: 'bg-red-500/10 text-red-500'}"
				>
					{packetStatus}
				</span>
			</div>

			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{packetDetail}</p>
				<p class="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
					PATHFINDER_M is {PATHFINDER_M}. Hop bytes at or above that value are rejected at unpack.
				</p>
			</div>

			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetPacketSim}
				>
					Reset
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={packetFinished}
					onclick={stepPacket}
				>
					{packetMode === 'plain' ? 'Play one hop' : 'Step'}
				</button>
			</div>
		</div>
	{:else if kind === 'link-sim'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-3 sm:gap-4">
				<div
					class="flex min-w-0 flex-1 flex-col items-center rounded-xl border p-4 transition-colors {linkSimFrame.from ===
						'A' || linkSimFrame.from === 'both'
						? 'border-[#00ADD8] bg-[#00ADD8]/10'
						: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}"
				>
					<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">A</span>
					<span class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Initiator</span>
				</div>

				<div class="flex shrink-0 flex-col items-center gap-1">
					<ArrowLeftRight
						class="h-5 w-5 transition-colors {linkSimActive
							? 'animate-pulse text-[#00ADD8]'
							: 'text-zinc-300 dark:text-zinc-700'}"
					/>
					<span class="text-[10px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
						{linkSimFrame.from === 'both' ? 'both' : linkSimFrame.from}
					</span>
				</div>

				<div
					class="flex min-w-0 flex-1 flex-col items-center rounded-xl border p-4 transition-colors {linkSimFrame.from ===
						'B' || linkSimFrame.from === 'both'
						? 'border-[#00ADD8] bg-[#00ADD8]/10'
						: 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}"
				>
					<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">B</span>
					<span class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Responder</span>
				</div>
			</div>

			<div class="flex items-center justify-center gap-2">
				{#each LINK_SIM_FRAMES as frame, index (frame.id)}
					<span
						class="h-2 w-2 rounded-full {index === linkSimIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>

			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{linkSimFrame.label}</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{linkSimFrame.detail}
				</p>
				<p class="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
					Can send data:
					<span
						class="font-semibold {linkSimFrame.canSendData
							? 'text-emerald-600 dark:text-emerald-400'
							: 'text-zinc-500 dark:text-zinc-400'}"
					>
						{linkSimFrame.canSendData ? 'yes' : 'no'}
					</span>
				</p>
			</div>

			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetLinkSim}
				>
					Reset
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
						disabled={isFirstLinkSim}
						onclick={prevLinkSim}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLastLinkSim}
						onclick={nextLinkSim}
					>
						<span class="hidden sm:inline">Next stage</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
