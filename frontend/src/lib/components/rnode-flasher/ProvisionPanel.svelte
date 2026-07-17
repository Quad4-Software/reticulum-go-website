<script lang="ts">
	import { Check, LoaderCircle } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import type { ProvisionResult } from '$lib/rnode-flasher';

	interface Props {
		result: ProvisionResult | null;
		busy: boolean;
		canRun: boolean;
		onProvision: () => void;
		onSkip: () => void;
	}

	let { result, busy, canRun, onProvision, onSkip }: Props = $props();
</script>

<div class="space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
	<p class="text-sm text-zinc-600 dark:text-zinc-400">
		{$t('tools.rnode_flasher.provision_blurb')}
	</p>
	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			class="inline-flex items-center gap-2 rounded-lg bg-[#00ADD8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
			disabled={!canRun || busy}
			onclick={onProvision}
		>
			{#if busy}
				<LoaderCircle class="h-4 w-4 animate-spin" />
			{:else}
				<Check class="h-4 w-4" />
			{/if}
			{$t('tools.rnode_flasher.provision_button')}
		</button>
		<button
			type="button"
			class="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
			disabled={!canRun || busy}
			onclick={onSkip}
		>
			{$t('tools.rnode_flasher.provision_skip')}
		</button>
	</div>
	{#if result}
		<p class="text-sm text-emerald-700 dark:text-emerald-300">{result.message}</p>
		{#if result.firmwareHash}
			<p class="break-all font-mono text-xs text-zinc-500">{result.firmwareHash}</p>
		{/if}
	{/if}
</div>
