<script lang="ts">
	import { Cpu, LoaderCircle } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { DeviceIdentity, FlashProgress, SessionPhase } from '$lib/rnode-flasher';

	interface Props {
		progress: FlashProgress | null;
		phase: SessionPhase;
		identity: DeviceIdentity | null;
	}

	let { progress, phase, identity }: Props = $props();

	let pct = $derived(
		progress && progress.bytesTotal > 0
			? Math.min(100, Math.round((progress.bytesWritten / progress.bytesTotal) * 100))
			: 0
	);
</script>

<div class="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
	<div class="flex flex-wrap items-center justify-between gap-2 text-sm">
		<span class="font-medium"
			>{$t('tools.rnode_flasher.phase_label')}: {phase}{progress
				? ` / ${progress.phase}`
				: ''}</span
		>
		{#if identity}
			<span class="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
				<Cpu class="h-3.5 w-3.5" />
				{identity.description}
			</span>
		{/if}
	</div>
	{#if progress}
		<div class="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
			<div class="h-full bg-[#00ADD8] transition-all" style={`width: ${pct}%`}></div>
		</div>
		<div class="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
			<span>{progress.message}</span>
			<span
				>{progress.bytesWritten} / {progress.bytesTotal} B · {Math.round(progress.rateBytesPerSec)} B/s</span
			>
		</div>
	{:else if phase === 'flash' || phase === 'connect' || phase === 'identify'}
		<div class="flex items-center gap-2 text-sm text-zinc-500">
			<LoaderCircle class="h-4 w-4 animate-spin" />
			{$t('tools.rnode_flasher.working')}
		</div>
	{:else}
		<p class="text-sm text-zinc-500">{$t('tools.rnode_flasher.progress_idle')}</p>
	{/if}
</div>
