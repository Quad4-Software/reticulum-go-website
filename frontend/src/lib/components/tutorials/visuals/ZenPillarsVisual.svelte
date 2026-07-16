<script lang="ts">
	let { activePillar = 0 }: { activePillar?: number } = $props();

	const pillars = [
		{
			id: 'open-source',
			label: 'Open source',
			hint: 'Availability, security, and transparency'
		},
		{
			id: 'medium-agnostic',
			label: 'Medium agnostic',
			hint: 'Radio, serial, Ethernet, WiFi, LoRa, and more'
		},
		{
			id: 'encryption-default',
			label: 'Encryption by default',
			hint: 'Communication encrypted unless explicitly plain'
		}
	];
</script>

<div class="grid gap-4 sm:grid-cols-3">
	{#each pillars as pillar, index (pillar.id)}
		<div
			class="rounded-xl border px-4 py-5 text-center transition-all duration-300 {index ===
			activePillar
				? 'border-[#00ADD8] bg-[#00ADD8]/10 shadow-sm scale-[1.02]'
				: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 opacity-80'}"
		>
			<p
				class="text-sm font-bold uppercase tracking-wide {index === activePillar
					? 'text-[#00ADD8]'
					: 'text-zinc-700 dark:text-zinc-300'}"
			>
				{pillar.label}
			</p>
			<p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{pillar.hint}</p>
		</div>
	{/each}
</div>
