<script lang="ts">
	type FlowNode = {
		id: string;
		label: string;
		hint?: string;
		accent?: boolean;
	};

	let {
		nodes,
		direction = 'row'
	}: {
		nodes: FlowNode[];
		direction?: 'row' | 'col';
	} = $props();

	const isRow = $derived(direction === 'row');
</script>

<div
	class="flex gap-3 {isRow
		? 'flex-col items-stretch sm:flex-row sm:flex-wrap sm:items-center sm:justify-center'
		: 'flex-col items-stretch'}"
	role="list"
	aria-label="Flow diagram"
>
	{#each nodes as node, index (node.id)}
		<div
			class="flex min-w-0 {isRow
				? 'flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3'
				: 'w-full flex-col gap-2'}"
		>
			<div
				role="listitem"
				class="min-w-0 rounded-xl border px-3 py-3 transition-colors sm:px-4 {node.accent
					? 'border-[#00ADD8] bg-[#00ADD8]/10'
					: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}"
			>
				<p
					class="text-sm font-semibold {node.accent
						? 'text-[#00ADD8]'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{node.label}
				</p>
				{#if node.hint}
					<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{node.hint}</p>
				{/if}
			</div>

			{#if index < nodes.length - 1}
				<div class="flex shrink-0 justify-center text-[#00ADD8]" aria-hidden="true">
					{#if isRow}
						<svg class="hidden h-5 w-8 sm:block" viewBox="0 0 32 20" fill="none">
							<path
								d="M2 10h24m0 0-6-6m6 6-6 6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<svg class="h-6 w-5 sm:hidden" viewBox="0 0 20 32" fill="none">
							<path
								d="M10 2v24m0 0-6-6m6 6 6-6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{:else}
						<svg class="h-6 w-5" viewBox="0 0 20 32" fill="none">
							<path
								d="M10 2v24m0 0-6-6m6 6 6-6"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>
