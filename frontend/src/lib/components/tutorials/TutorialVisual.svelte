<script lang="ts">
	import type { TutorialVisualId } from '$lib/tutorials/types';
	import ZenPillarsVisual from './visuals/ZenPillarsVisual.svelte';
	import DestinationTypesVisual from './visuals/DestinationTypesVisual.svelte';
	import AnnounceFloodVisual from './visuals/AnnounceFloodVisual.svelte';
	import CryptoStackVisual from './visuals/CryptoStackVisual.svelte';
	import PacketPathVisual from './visuals/PacketPathVisual.svelte';
	import PacketWireframeVisual from './visuals/PacketWireframeVisual.svelte';
	import LinkLifecycleVisual from './visuals/LinkLifecycleVisual.svelte';
	import InterfacesMeshVisual from './visuals/InterfacesMeshVisual.svelte';
	import MessagingFlowVisual from './visuals/MessagingFlowVisual.svelte';

	let {
		visual,
		stepIndex = 0,
		visualFocus,
		stepId = '',
		headerType = 1
	}: {
		visual: TutorialVisualId;
		stepIndex?: number;
		visualFocus?: number;
		stepId?: string;
		headerType?: 1 | 2;
	} = $props();

	const focus = $derived(visualFocus ?? resolveVisualFocus(visual, stepId, stepIndex));

	function resolveVisualFocus(id: TutorialVisualId, sid: string, index: number): number {
		const byStep: Record<string, number> = {
			motivation: 0,
			goals: 1,
			sovereignty: 2,
			'first-build': 2,
			hash: 0,
			types: 1,
			aspects: 2,
			'build-order': 3,
			'what-is-identity': 0,
			'portable-self': 1,
			'recall-and-trust': 1,
			'announce-contents': 0,
			propagation: 1,
			paths: 2,
			roaming: 3,
			discovery: 2,
			primitives: 0,
			'identity-token': 1,
			'links-ratchets': 2,
			'operator-habits': 3,
			ingress: 0,
			forward: 1,
			blackhole: 2,
			delivery: 3,
			'debug-checklist': 3,
			wireframe: 0,
			'why-links': 0,
			lifecycle: 2,
			'requests-resources': 2,
			'reticulum-vs-app': 0,
			'delivery-path': 2,
			'try-in-browser': 4,
			'medium-agnostic': 0,
			'pick-carrier': 1,
			'mix-strategies': 2
		};
		if (sid && sid in byStep) return byStep[sid];
		void id;
		return index;
	}
</script>

<div
	class="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
>
	{#if visual === 'zen-pillars'}
		<ZenPillarsVisual activePillar={focus % 3} />
	{:else if visual === 'destination-types'}
		<DestinationTypesVisual activeIndex={Math.min(focus, 3)} />
	{:else if visual === 'announce-flood'}
		<AnnounceFloodVisual highlightHop={Math.min(focus, 3)} />
	{:else if visual === 'crypto-stack'}
		<CryptoStackVisual activeLayer={Math.min(focus, 3)} />
	{:else if visual === 'packet-path'}
		<PacketPathVisual activeHop={Math.min(focus, 3)} />
	{:else if visual === 'packet-wireframe'}
		<PacketWireframeVisual activeField={Math.min(focus, 5)} {headerType} />
	{:else if visual === 'link-lifecycle'}
		<LinkLifecycleVisual activeStage={Math.min(focus, 3)} />
	{:else if visual === 'interfaces-mesh'}
		<InterfacesMeshVisual activeIndex={Math.min(focus, 4)} />
	{:else if visual === 'messaging-flow'}
		<MessagingFlowVisual activeStage={Math.min(focus, 4)} />
	{/if}
</div>
