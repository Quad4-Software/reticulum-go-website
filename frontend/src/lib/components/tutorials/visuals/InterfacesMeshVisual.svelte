<script lang="ts">
	let { activeIndex = 0 }: { activeIndex?: number } = $props();

	const carriers = [
		{ id: 'radio', label: 'Radio / LoRa', hint: 'RNode path', go: false },
		{ id: 'tcp', label: 'TCP', hint: 'IP backhaul', go: true },
		{ id: 'udp', label: 'UDP', hint: 'LAN / WAN', go: true },
		{ id: 'ws', label: 'WebSocket', hint: 'Browser WASM', go: true },
		{ id: 'serial', label: 'Serial', hint: 'Modems', go: false }
	];

	const focus = $derived(Math.min(activeIndex, carriers.length - 1));
</script>

<div class="space-y-4">
	<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
		{#each carriers as carrier, index (carrier.id)}
			<div
				class="rounded-xl border px-3 py-3 transition-all duration-300 {index === focus
					? 'border-[#00ADD8] bg-[#00ADD8]/10'
					: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}"
			>
				<p
					class="text-sm font-semibold {index === focus
						? 'text-[#00ADD8]'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{carrier.label}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{carrier.hint}</p>
				<p
					class="mt-2 text-[10px] font-semibold uppercase tracking-wide {carrier.go
						? 'text-[#00ADD8]'
						: 'text-zinc-400 dark:text-zinc-500'}"
				>
					{carrier.go ? 'In Go' : 'Python ref'}
				</p>
			</div>
		{/each}
	</div>
	<p class="text-center text-xs text-zinc-500 dark:text-zinc-400">
		One mesh can mix carriers. Destinations stay the same while the medium changes.
	</p>
</div>
