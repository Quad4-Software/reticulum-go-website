<script lang="ts">
	let { activeIndex = 0 }: { activeIndex?: number } = $props();

	const destinations = [
		{ id: 'single', label: 'Single', hint: 'Unique public key, encrypted', multiHop: true },
		{ id: 'plain', label: 'Plain', hint: 'Local, unencrypted', multiHop: false },
		{ id: 'group', label: 'Group', hint: 'Symmetric key, local today', multiHop: false },
		{
			id: 'link',
			label: 'Link',
			hint: 'Channel with reliability and forward secrecy',
			multiHop: true
		}
	];
</script>

<div class="grid gap-3 sm:grid-cols-2">
	{#each destinations as dest, index (dest.id)}
		<div
			class="rounded-xl border px-4 py-4 transition-colors {index === activeIndex
				? 'border-[#00ADD8] bg-[#00ADD8]/10'
				: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}"
		>
			<div class="flex items-start justify-between gap-2">
				<p
					class="text-sm font-bold {index === activeIndex
						? 'text-[#00ADD8]'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{dest.label}
				</p>
				{#if dest.multiHop}
					<span
						class="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[#00ADD8] text-white"
					>
						Multi-hop
					</span>
				{/if}
			</div>
			<p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{dest.hint}</p>
		</div>
	{/each}
</div>
