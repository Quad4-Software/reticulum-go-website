<script lang="ts">
	import type { TutorialVisualId } from '$lib/tutorials/types';
	import ZenPillarsVisual from './visuals/ZenPillarsVisual.svelte';
	import DestinationTypesVisual from './visuals/DestinationTypesVisual.svelte';
	import AnnounceFloodVisual from './visuals/AnnounceFloodVisual.svelte';
	import CryptoStackVisual from './visuals/CryptoStackVisual.svelte';
	import PacketPathVisual from './visuals/PacketPathVisual.svelte';
	import LinkLifecycleVisual from './visuals/LinkLifecycleVisual.svelte';
	import InterfacesMeshVisual from './visuals/InterfacesMeshVisual.svelte';

	let {
		visual,
		stepIndex = 0
	}: {
		visual: TutorialVisualId;
		stepIndex?: number;
	} = $props();
</script>

<div
	class="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
>
	{#if visual === 'zen-pillars'}
		<ZenPillarsVisual activePillar={stepIndex % 3} />
	{:else if visual === 'destination-types'}
		<DestinationTypesVisual activeIndex={Math.min(stepIndex, 3)} />
	{:else if visual === 'announce-flood'}
		<AnnounceFloodVisual step={stepIndex} highlightHop={Math.min(stepIndex, 3)} />
	{:else if visual === 'crypto-stack'}
		<CryptoStackVisual activeLayer={Math.min(stepIndex, 3)} />
	{:else if visual === 'packet-path'}
		<PacketPathVisual activeHop={Math.min(stepIndex, 3)} />
	{:else if visual === 'link-lifecycle'}
		<LinkLifecycleVisual activeStage={Math.min(stepIndex, 3)} />
	{:else if visual === 'interfaces-mesh'}
		<InterfacesMeshVisual activeIndex={Math.min(stepIndex, 4)} />
	{/if}
</div>
