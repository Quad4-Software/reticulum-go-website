<script lang="ts">
	import { Monitor, Sun, Moon } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { theme, isDark, setTheme } from '$lib/theme';

	const options: { value: import('$lib/theme').Theme; label: string; icon: typeof Sun }[] = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Monitor }
	];

	let open = $state(false);
	let el: HTMLElement;

	function select(t: import('$lib/theme').Theme) {
		setTheme(t);
		open = false;
	}

	function handleClickOutside(e: MouseEvent) {
		if (el && !el.contains(e.target as Node)) open = false;
	}

	$effect(() => {
		if (!open) return;
		const handler = (e: MouseEvent) => handleClickOutside(e);
		document.addEventListener('click', handler, true);
		return () => document.removeEventListener('click', handler, true);
	});
</script>

<div bind:this={el} class="relative">
	<button
		type="button"
		onclick={() => (open = !open)}
		aria-expanded={open}
		aria-haspopup="listbox"
		aria-label="Select theme"
		class="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:ring-2 ring-[#00ADD8]/50 transition-all flex items-center justify-center"
	>
		{#if $theme === 'light'}
			<Sun class="w-5 h-5" />
		{:else if $theme === 'dark'}
			<Moon class="w-5 h-5" />
		{:else}
			<Monitor class="w-5 h-5" />
		{/if}
	</button>
	{#if open}
		<div
			transition:slide={{ duration: 150 }}
			class="absolute right-0 mt-2 min-w-[8rem] rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-900/10 dark:shadow-black/40 py-1.5 z-50"
			role="listbox"
			aria-label="Theme options"
		>
			{#each options as opt (opt.value)}
				<button
					type="button"
					role="option"
					aria-selected={$theme === opt.value}
					onclick={() => select(opt.value)}
					class="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors {$theme ===
					opt.value
						? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
						: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'}"
				>
					<opt.icon class="w-4 h-4 shrink-0" />
					<span>{opt.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
