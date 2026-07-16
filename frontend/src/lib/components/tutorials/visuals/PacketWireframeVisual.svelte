<script lang="ts">
	let {
		activeField = 0,
		headerType = 1
	}: {
		activeField?: number;
		headerType?: 1 | 2;
	} = $props();

	const allFields: { id: string; label: string; types: Array<1 | 2> }[] = [
		{ id: 'flags', label: 'Flags', types: [1, 2] },
		{ id: 'hops', label: 'Hops', types: [1, 2] },
		{ id: 'dest', label: 'Dest hash', types: [1, 2] },
		{ id: 'transport', label: 'Transport ID', types: [2] },
		{ id: 'context', label: 'Context', types: [1, 2] },
		{ id: 'payload', label: 'Payload', types: [1, 2] }
	];

	const fields = $derived(allFields.filter((field) => field.types.includes(headerType)));
	const visibleIndex = $derived(Math.min(activeField, Math.max(fields.length - 1, 0)));
</script>

<div class="space-y-4">
	<p
		class="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
	>
		Header type {headerType}
	</p>
	<div
		class="flex min-h-16 overflow-hidden rounded-xl border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950"
	>
		{#each fields as field, index (field.id)}
			<div
				class="flex min-w-0 flex-1 flex-col items-center justify-center border-r border-zinc-200 px-1 py-2 text-center last:border-r-0 dark:border-zinc-800 {index ===
				visibleIndex
					? 'bg-[#00ADD8]/15 text-[#00ADD8]'
					: 'text-zinc-600 dark:text-zinc-400'}"
			>
				<span class="text-[10px] font-semibold leading-tight sm:text-xs">{field.label}</span>
			</div>
		{/each}
	</div>
	<p class="text-center text-xs text-zinc-500 dark:text-zinc-400">
		Type 2 adds a transport ID for multi-hop relay. Hops still face PATHFINDER_M at unpack.
	</p>
</div>
