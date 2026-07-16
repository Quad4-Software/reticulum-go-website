<script lang="ts">
	import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { TutorialInteractiveId } from '$lib/tutorials/types';
	import {
		DESTINATION_RULES,
		evaluateHopLimit,
		CRYPTO_PIPELINE,
		buildAnnounceReplay,
		INTERFACE_CARDS,
		PATHFINDER_M,
		PACKET_SIM_NODES,
		stepPacketSim,
		LINK_SIM_FRAMES,
		IDENTITY_RECALL_STAGES,
		RESOURCE_PATH_STAGES,
		LXMF_FLOW_STAGES,
		PACKET_WIRE_FIELDS,
		blackholeAnnounceOutcome,
		DISCOVERY_MODES,
		type DestinationKind,
		type InterfaceKind,
		type PacketSimMode,
		type PacketSimState
	} from '$lib/tutorials/interactive';

	let {
		kind,
		tryIt: _tryIt,
		wireHeaderType = $bindable<1 | 2>(1),
		wireFieldIndex = $bindable(0)
	}: {
		kind: TutorialInteractiveId;
		tryIt?: string;
		wireHeaderType?: 1 | 2;
		wireFieldIndex?: number;
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

	let identityRecallIndex = $state(0);
	const identityRecallStage = $derived(IDENTITY_RECALL_STAGES[identityRecallIndex]);
	const isFirstIdentityRecall = $derived(identityRecallIndex === 0);
	const isLastIdentityRecall = $derived(identityRecallIndex === IDENTITY_RECALL_STAGES.length - 1);

	function resetIdentityRecall() {
		identityRecallIndex = 0;
	}

	function nextIdentityRecall() {
		if (!isLastIdentityRecall) identityRecallIndex += 1;
	}

	function prevIdentityRecall() {
		if (!isFirstIdentityRecall) identityRecallIndex -= 1;
	}

	let resourcePathIndex = $state(0);
	const resourcePathStage = $derived(RESOURCE_PATH_STAGES[resourcePathIndex]);
	const isFirstResourcePath = $derived(resourcePathIndex === 0);
	const isLastResourcePath = $derived(resourcePathIndex === RESOURCE_PATH_STAGES.length - 1);

	function resetResourcePath() {
		resourcePathIndex = 0;
	}

	function nextResourcePath() {
		if (!isLastResourcePath) resourcePathIndex += 1;
	}

	function prevResourcePath() {
		if (!isFirstResourcePath) resourcePathIndex -= 1;
	}

	let lxmfFlowIndex = $state(0);
	const lxmfFlowStage = $derived(LXMF_FLOW_STAGES[lxmfFlowIndex]);
	const isFirstLxmfFlow = $derived(lxmfFlowIndex === 0);
	const isLastLxmfFlow = $derived(lxmfFlowIndex === LXMF_FLOW_STAGES.length - 1);

	function resetLxmfFlow() {
		lxmfFlowIndex = 0;
	}

	function nextLxmfFlow() {
		if (!isLastLxmfFlow) lxmfFlowIndex += 1;
	}

	function prevLxmfFlow() {
		if (!isFirstLxmfFlow) lxmfFlowIndex -= 1;
	}

	const wireFields = $derived(
		PACKET_WIRE_FIELDS.filter((field) => field.headerTypes.includes(wireHeaderType))
	);
	const wireField = $derived(wireFields[wireFieldIndex] ?? wireFields[0]);
	const isFirstWireField = $derived(wireFieldIndex === 0);
	const isLastWireField = $derived(wireFieldIndex >= wireFields.length - 1);

	function setWireHeaderType(type: 1 | 2) {
		wireHeaderType = type;
		wireFieldIndex = 0;
	}

	function selectWireField(index: number) {
		wireFieldIndex = index;
	}

	function resetWireframe() {
		wireHeaderType = 1;
		wireFieldIndex = 0;
	}

	function nextWireField() {
		if (!isLastWireField) wireFieldIndex += 1;
	}

	function prevWireField() {
		if (!isFirstWireField) wireFieldIndex -= 1;
	}

	let blackholeEnabled = $state(false);
	const blackholeOutcome = $derived(blackholeAnnounceOutcome(blackholeEnabled));

	let activeDiscoveryIndex = $state(0);
	const activeDiscovery = $derived(DISCOVERY_MODES[activeDiscoveryIndex]);
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
	{:else if kind === 'packet-wireframe'}
		<div class="space-y-3">
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {wireHeaderType ===
					1
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={wireHeaderType === 1}
					onclick={() => setWireHeaderType(1)}
				>
					{$t('tools.reticulum_guide.header_type_1')}
				</button>
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {wireHeaderType ===
					2
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={wireHeaderType === 2}
					onclick={() => setWireHeaderType(2)}
				>
					{$t('tools.reticulum_guide.header_type_2')}
				</button>
			</div>

			<div class="flex flex-wrap gap-2">
				{#each wireFields as field, index (field.id)}
					<button
						type="button"
						class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors {index ===
						wireFieldIndex
							? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
							: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
						aria-pressed={index === wireFieldIndex}
						onclick={() => selectWireField(index)}
					>
						{field.label}
					</button>
				{/each}
			</div>

			<div
				class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{wireField.label}</p>
				<p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
					{$t('tools.reticulum_guide.bytes_label', { values: { bytes: wireField.bytes } })}
				</p>
				<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{wireField.detail}</p>
			</div>

			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetWireframe}
				>
					{$t('tools.reticulum_guide.reset')}
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
						disabled={isFirstWireField}
						onclick={prevWireField}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLastWireField}
						onclick={nextWireField}
					>
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:else if kind === 'blackhole-toggle'}
		<div class="space-y-3">
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {!blackholeEnabled
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={!blackholeEnabled}
					onclick={() => (blackholeEnabled = false)}
				>
					{$t('tools.reticulum_guide.blackhole_off')}
				</button>
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors sm:px-4 {blackholeEnabled
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={blackholeEnabled}
					onclick={() => (blackholeEnabled = true)}
				>
					{$t('tools.reticulum_guide.blackhole_on')}
				</button>
			</div>

			<div class="flex items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400">
				<span>Announce</span>
				<span
					class="rounded-full px-2.5 py-1 text-xs font-semibold {blackholeOutcome.status ===
					'accepted'
						? 'bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'bg-red-500/10 text-red-500'}"
				>
					{blackholeOutcome.status === 'accepted'
						? $t('tools.reticulum_guide.accepted')
						: $t('tools.reticulum_guide.status_dropped')}
				</span>
			</div>

			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{blackholeOutcome.detail}
				</p>
			</div>
		</div>
	{:else if kind === 'discovery-modes'}
		<div class="flex flex-wrap gap-2">
			{#each DISCOVERY_MODES as mode, index (mode.id)}
				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-sm font-medium transition-colors {activeDiscoveryIndex ===
					index
						? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
						: 'border-zinc-200 text-zinc-600 hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800 dark:text-zinc-400'}"
					aria-pressed={activeDiscoveryIndex === index}
					onclick={() => (activeDiscoveryIndex = index)}
				>
					{mode.label}
				</button>
			{/each}
		</div>
		<div
			class="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
		>
			<p class="text-sm text-zinc-600 dark:text-zinc-400">
				Allows unknown path
				<span class="font-semibold text-zinc-900 dark:text-zinc-100">
					{activeDiscovery.allowsUnknownPath
						? $t('tools.reticulum_guide.yes')
						: $t('tools.reticulum_guide.no')}
				</span>
			</p>
			<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
				{activeDiscovery.detail}
			</p>
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
				<span>{$t('tools.reticulum_guide.hops_label', { values: { hops: hopOutcome.hops } })}</span>
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
						{mode === 'encrypted'
							? $t('tools.reticulum_guide.encrypted')
							: $t('tools.reticulum_guide.plain')}
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

			<div
				class="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-600 dark:text-zinc-400"
			>
				<span>{$t('tools.reticulum_guide.hops_label', { values: { hops: packetHops } })}</span>
				<span
					class="rounded-full px-2.5 py-1 text-xs font-semibold {packetStatus === 'moving'
						? 'bg-[#00ADD8]/10 text-[#00ADD8]'
						: packetStatus === 'delivered'
							? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
							: packetStatus === 'local-only'
								? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
								: 'bg-red-500/10 text-red-500'}"
				>
					{packetStatus === 'moving'
						? $t('tools.reticulum_guide.status_moving')
						: packetStatus === 'delivered'
							? $t('tools.reticulum_guide.status_delivered')
							: packetStatus === 'local-only'
								? $t('tools.reticulum_guide.status_local_only')
								: $t('tools.reticulum_guide.status_dropped')}
				</span>
			</div>

			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{packetDetail}</p>
				<p class="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
					{$t('tools.reticulum_guide.pathfinder_note', { values: { m: PATHFINDER_M } })}
				</p>
			</div>

			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetPacketSim}
				>
					{$t('tools.reticulum_guide.reset')}
				</button>
				<button
					type="button"
					class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
					disabled={packetFinished}
					onclick={stepPacket}
				>
					{$t('tools.reticulum_guide.step_once')}
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
					{$t('tools.reticulum_guide.can_send_data')}
					<span
						class="font-semibold {linkSimFrame.canSendData
							? 'text-emerald-600 dark:text-emerald-400'
							: 'text-zinc-500 dark:text-zinc-400'}"
					>
						{linkSimFrame.canSendData
							? $t('tools.reticulum_guide.yes')
							: $t('tools.reticulum_guide.no')}
					</span>
				</p>
			</div>

			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetLinkSim}
				>
					{$t('tools.reticulum_guide.reset')}
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
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:else if kind === 'identity-recall'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each IDENTITY_RECALL_STAGES as stage, index (stage.id)}
					<span
						class="h-2 w-2 rounded-full {index === identityRecallIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					{identityRecallStage.label}
				</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{identityRecallStage.detail}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetIdentityRecall}
				>
					{$t('tools.reticulum_guide.reset')}
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
						disabled={isFirstIdentityRecall}
						onclick={prevIdentityRecall}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLastIdentityRecall}
						onclick={nextIdentityRecall}
					>
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:else if kind === 'resource-path'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each RESOURCE_PATH_STAGES as stage, index (stage.id)}
					<span
						class="h-2 w-2 rounded-full {index === resourcePathIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
					{resourcePathStage.label}
				</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{resourcePathStage.detail}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetResourcePath}
				>
					{$t('tools.reticulum_guide.reset')}
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
						disabled={isFirstResourcePath}
						onclick={prevResourcePath}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLastResourcePath}
						onclick={nextResourcePath}
					>
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{:else if kind === 'lxmf-flow'}
		<div class="space-y-3">
			<div class="flex items-center justify-center gap-2">
				{#each LXMF_FLOW_STAGES as stage, index (stage.id)}
					<span
						class="h-2 w-2 rounded-full {index === lxmfFlowIndex
							? 'bg-[#00ADD8]'
							: 'bg-zinc-300 dark:bg-zinc-700'}"
					></span>
				{/each}
			</div>
			<div
				class="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50"
			>
				<p class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{lxmfFlowStage.label}</p>
				<p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
					{lxmfFlowStage.detail}
				</p>
			</div>
			<div class="flex items-center justify-between gap-2">
				<button
					type="button"
					class="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] dark:border-zinc-800"
					onclick={resetLxmfFlow}
				>
					{$t('tools.reticulum_guide.reset')}
				</button>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium transition-colors hover:border-[#00ADD8] hover:text-[#00ADD8] disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800"
						disabled={isFirstLxmfFlow}
						onclick={prevLxmfFlow}
					>
						<ChevronLeft class="h-4 w-4" />
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.previous')}</span>
					</button>
					<button
						type="button"
						class="inline-flex items-center gap-1 rounded-lg bg-[#00ADD8] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0099c0] disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLastLxmfFlow}
						onclick={nextLxmfFlow}
					>
						<span class="hidden sm:inline">{$t('tools.reticulum_guide.next')}</span>
						<ChevronRight class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
