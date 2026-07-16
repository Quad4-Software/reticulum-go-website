<script lang="ts">
	import FlowNodes from './FlowNodes.svelte';

	let {
		step = 0,
		highlightHop = 0
	}: {
		step?: number;
		highlightHop?: number;
	} = $props();

	const hops = [
		{ id: 'origin', label: 'Origin', hint: 'Signed announce' },
		{ id: 'hop-1', label: 'Transport hop 1', hint: 'Record sender, hop count' },
		{ id: 'hop-2', label: 'Transport hop 2', hint: 'Retransmit after delay' },
		{ id: 'hop-n', label: '…', hint: 'Stop near m = 128' }
	];

	const nodes = $derived(
		hops.map((hop, index) => ({
			...hop,
			accent: index === highlightHop
		}))
	);
</script>

<div
	class="space-y-4 transition-all duration-500"
	style:opacity={step >= 0 ? 1 : 0.4}
	style:transform={step >= 0 ? 'translateY(0)' : 'translateY(8px)'}
>
	<div class="flex justify-center">
		<span
			class="inline-flex items-center rounded-full border border-[#00ADD8] bg-[#00ADD8]/10 px-3 py-1 text-xs font-semibold text-[#00ADD8] transition-all duration-300 {step >=
			0
				? 'opacity-100 scale-100'
				: 'opacity-0 scale-95'}"
		>
			Signed announce
		</span>
	</div>

	<FlowNodes {nodes} direction="row" />

	<p
		class="text-center text-xs text-zinc-500 dark:text-zinc-400 transition-all duration-500 {step >=
		1
			? 'opacity-100 translate-y-0'
			: 'opacity-60 translate-y-1'}"
	>
		Transport nodes forward announces hop by hop, stopping after m + 1 retransmissions (default m =
		128).
	</p>
</div>
