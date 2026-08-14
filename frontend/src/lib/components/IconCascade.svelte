<script lang="ts" module>
	export type CascadeItem = {
		id: string;
		src: string;
		/** i18n message id, resolved with $t() */
		nameKey: string;
		/** centered soon overlay on the circle */
		soon?: boolean;
		/** i18n key for the soon overlay (defaults to home.platforms.soon_badge) */
		soonKey?: string;
		/** themed circle backdrop for logos that need contrast (e.g. black wordmarks) */
		circleBg?: 'bliss' | 'aero';
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

	const defaultSoonKey = 'home.platforms.soon_badge';

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
						class="relative inline-flex {dims.circle} items-center justify-center overflow-hidden rounded-full p-1.5 shadow-sm ring-2 ring-white transition-transform group-hover:z-20 group-hover:-translate-y-0.5 group-hover:scale-110 dark:ring-zinc-950 {item.circleBg
							? ''
							: 'bg-zinc-100/90 dark:bg-zinc-800'}"
					>
						{#if item.circleBg === 'bliss'}
							<span class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
								<span
									class="absolute -inset-[18%] scale-[1.35] bg-[linear-gradient(180deg,#7eb8e8_0%,#8ec8f4_34%,#79c956_34%,#3d8f32_100%)] blur-[1.5px] opacity-95"
								></span>
								<span
									class="absolute inset-0 bg-[linear-gradient(180deg,rgba(126,184,232,0.35)_0%,rgba(126,184,232,0.2)_34%,rgba(61,143,50,0.15)_100%)]"
								></span>
							</span>
						{:else if item.circleBg === 'aero'}
							<span class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
								<span
									class="absolute inset-0 bg-[linear-gradient(180deg,#8ed4f8_0%,#5aace8_38%,#3b7fc4_72%,#245a9e_100%)]"
								></span>
								<span
									class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.18)_32%,rgba(255,255,255,0)_52%)]"
								></span>
								<span
									class="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.28)_0%,transparent_42%,rgba(15,50,95,0.22)_100%)]"
								></span>
								<span
									class="absolute left-[12%] top-[8%] h-[28%] w-[55%] rounded-full bg-white/45 blur-[2px]"
								></span>
							</span>
						{/if}
						<img
							src={item.src}
							alt=""
							width={dims.px}
							height={dims.px}
							loading="lazy"
							decoding="async"
							class="relative z-[1] {dims.img} object-contain {item.soon
								? 'scale-110 blur-[2.5px] opacity-50'
								: ''}"
							title={$t(item.nameKey)}
						/>
						{#if item.soon}
							<span class="soon-overlay" aria-hidden="true"
								>{$t(item.soonKey ?? defaultSoonKey)}</span
							>
						{/if}
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

<style>
	.soon-overlay {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		border-radius: 9999px;
		background: rgb(9 9 11 / 0.28);
		font-size: 8px;
		font-weight: 800;
		letter-spacing: 0.04em;
		line-height: 1;
		text-transform: uppercase;
		white-space: nowrap;
		color: #fff;
		text-shadow: 0 1px 2px rgb(0 0 0 / 0.7);
	}
</style>
