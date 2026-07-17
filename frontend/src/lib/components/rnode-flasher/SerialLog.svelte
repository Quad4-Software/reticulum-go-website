<script lang="ts">
	import { ScrollText } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { LogLine } from '$lib/rnode-flasher';

	interface Props {
		logs: LogLine[];
	}

	let { logs }: Props = $props();
	let open = $state(false);
</script>

<details class="rounded-xl border border-zinc-200 dark:border-zinc-800" bind:open>
	<summary class="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium">
		<ScrollText class="h-4 w-4 text-[#00ADD8]" />
		{$t('tools.rnode_flasher.log_title')} ({logs.length})
	</summary>
	<div
		class="max-h-48 overflow-auto border-t border-zinc-200 px-4 py-2 font-mono text-xs dark:border-zinc-800"
	>
		{#each logs as line (line.ts + line.message)}
			<p
				class={line.level === 'error'
					? 'text-red-600 dark:text-red-400'
					: line.level === 'warn'
						? 'text-amber-600 dark:text-amber-300'
						: 'text-zinc-600 dark:text-zinc-400'}
			>
				{new Date(line.ts).toLocaleTimeString()} [{line.level}] {line.message}
			</p>
		{:else}
			<p class="text-zinc-500">{$t('tools.rnode_flasher.log_empty')}</p>
		{/each}
	</div>
</details>
