<script lang="ts">
	import FlowNodes from './FlowNodes.svelte';

	let { activeStage = 0 }: { activeStage?: number } = $props();

	const stages = [
		{ id: 'identity', label: 'Identity', hint: 'Keyset' },
		{ id: 'announce', label: 'Announce', hint: 'Be findable' },
		{ id: 'path', label: 'Path', hint: 'Next hop' },
		{ id: 'deliver', label: 'Deliver', hint: 'Encrypted' },
		{ id: 'app', label: 'App', hint: 'LXMF layer' }
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
		Reticulum carries encrypted traffic to destinations. LXMF and similar apps define the message
		format on top.
	</p>
</div>
