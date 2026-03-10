<script lang="ts">
	import { Monitor, Sun, Moon } from 'lucide-svelte';

	let { currentTheme = 'system', currentPath = '/' } = $props();

	const options = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	] as const;
</script>

<details class="relative">
	<summary
		aria-label="Select theme"
		class="list-none cursor-pointer p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:ring-2 ring-[#00ADD8]/50 transition-all flex items-center justify-center"
	>
		{#if currentTheme === 'light'}
			<Sun class="w-5 h-5" />
		{:else if currentTheme === 'dark'}
			<Moon class="w-5 h-5" />
		{:else}
			<Monitor class="w-5 h-5" />
		{/if}
	</summary>
	<div
		class="absolute right-0 mt-2 min-w-[8rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-50"
	>
		{#each options as opt (opt.value)}
			<a
				href={`/set-theme?theme=${opt.value}&redirect=${encodeURIComponent(currentPath)}`}
				aria-current={currentTheme === opt.value ? 'true' : undefined}
				class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {currentTheme ===
				opt.value
					? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
					: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'}"
			>
				<opt.icon class="w-4 h-4 shrink-0" />
				<span>{opt.label}</span>
			</a>
		{/each}
	</div>
</details>
