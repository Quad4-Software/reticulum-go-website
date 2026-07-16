<script lang="ts">
	import FlowNodes from './FlowNodes.svelte';

	let { activeHop = 0 }: { activeHop?: number } = $props();

	const hops = [
		{ id: 'node-a', label: 'A', hint: 'Sender' },
		{ id: 'node-b', label: 'B', hint: 'Relay' },
		{ id: 'node-c', label: 'C', hint: 'Relay' },
		{ id: 'destination', label: 'Destination', hint: 'Local delivery' }
	];

	const nodes = $derived(
		hops.map((hop, index) => ({
			...hop,
			accent: index === activeHop || (activeHop >= hops.length && index === hops.length - 1)
		}))
	);
</script>

<div class="space-y-4">
	<FlowNodes {nodes} direction="row" />

	<p class="text-center text-xs text-zinc-500 dark:text-zinc-400">
		Each transport node only knows the next hop toward a destination, not the full path.
	</p>
</div>
