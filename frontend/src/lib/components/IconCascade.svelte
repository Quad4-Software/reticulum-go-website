<script lang="ts" module>
	export type CascadeItem = {
		id: string;
		src: string;
		/** i18n message id, resolved with $t() */
		nameKey: string;
	};
</script>

<script lang="ts">
	import { t } from 'svelte-i18n';

	let {
		items,
		labelKey,
		ariaLabelKey,
		size = 'md',
		class: className = ''
	}: {
		items: readonly CascadeItem[];
		/** optional label shown before the icons, i18n key */
		labelKey?: string;
		/** aria-label i18n key when no visible labelKey is set */
		ariaLabelKey?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	} = $props();

	const sizes = {
		sm: { circle: 'h-7 w-7', img: 'h-4 w-4', px: 16 },
		md: { circle: 'h-8 w-8', img: 'h-5 w-5', px: 20 },
		lg: { circle: 'h-10 w-10', img: 'h-6 w-6', px: 24 }
	} as const;

	let dims = $derived(sizes[size]);
	let listLabelKey = $derived(ariaLabelKey ?? labelKey);
</script>

<div class="flex flex-wrap items-center gap-3 {className}">
	{#if labelKey}
		<span class="text-sm text-zinc-600 dark:text-zinc-400">{$t(labelKey)}</span>
	{/if}
	<ul class="flex items-center pl-0.5" aria-label={listLabelKey ? $t(listLabelKey) : undefined}>
		{#each items as item, i (item.id)}
			<li
				class="relative"
				style={`z-index: ${items.length - i}; margin-left: ${i === 0 ? '0' : '-0.5rem'}`}
			>
				<span class="group relative inline-flex">
					<span
						class="inline-flex {dims.circle} items-center justify-center rounded-full bg-zinc-100/90 p-1.5 shadow-sm ring-2 ring-white transition-transform group-hover:z-20 group-hover:-translate-y-0.5 group-hover:scale-110 dark:bg-zinc-800 dark:ring-zinc-950"
					>
						<img
							src={item.src}
							alt=""
							width={dims.px}
							height={dims.px}
							loading="lazy"
							decoding="async"
							class="{dims.img} object-contain"
							title={$t(item.nameKey)}
						/>
					</span>
					<span
						class="pointer-events-none absolute -bottom-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
						role="tooltip"
					>
						{$t(item.nameKey)}
					</span>
				</span>
			</li>
		{/each}
	</ul>
</div>
