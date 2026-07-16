<script lang="ts">
	import FlowNodes from './FlowNodes.svelte';

	let { activeStage = 0 }: { activeStage?: number } = $props();

	const stages = [
		{ id: 'request', label: 'LINKREQUEST', hint: 'Open session' },
		{ id: 'identify', label: 'LINKIDENTIFY', hint: 'Exchange keys' },
		{ id: 'ready', label: 'LINKREADY', hint: 'Send traffic' },
		{ id: 'close', label: 'LINKCLOSE', hint: 'Tear down' }
	];

	const nodes = $derived(
		stages.map((stage, index) => ({
			...stage,
			accent: index === Math.min(activeStage, stages.length - 1)
		}))
	);
</script>

<div class="space-y-4">
	<FlowNodes {nodes} direction="row" />
	<p class="text-center text-xs text-zinc-500 dark:text-zinc-400">
		Application data belongs on a ready link. Requests, channels, and resources ride the same
		session.
	</p>
</div>
