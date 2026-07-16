<script lang="ts">
	import { ChevronLeft, ChevronRight, Sparkles, Lightbulb } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { TutorialInteractiveId } from '$lib/tutorials/types';
	import {
		DESTINATION_RULES,
		evaluateHopLimit,
		CRYPTO_PIPELINE,
		buildAnnounceReplay,
		LINK_STAGES,
		INTERFACE_CARDS,
		type DestinationKind,
		type InterfaceKind
	} from '$lib/tutorials/interactive';

	let {
		kind,
		tryIt
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
</script>

<div
	class="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
>
	<h3 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#00ADD8]">
		<Sparkles class="h-4 w-4 shrink-0" />
		<span>{$t('tools.reticulum_guide.interactive_title')}</span>
	</h3>

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
	{/if}

	{#if tryIt}
		<p class="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-500">
			<Lightbulb class="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00ADD8]" />
			<span class="min-w-0"
				><strong class="font-semibold">{$t('tools.reticulum_guide.try_it')}:</strong> {tryIt}</span
			>
		</p>
	{/if}
</div>
