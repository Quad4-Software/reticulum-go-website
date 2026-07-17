<script lang="ts">
	import { Download, LoaderCircle, Upload } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { FIRMWARE_SOURCES, type CatalogEntry, type FirmwareSourceId } from '$lib/rnode-flasher';

	interface Props {
		source: FirmwareSourceId;
		entries: CatalogEntry[];
		busy: boolean;
		selectedId: string | null;
		onSource: (id: FirmwareSourceId) => void;
		onSelect: (entry: CatalogEntry) => void;
		onUpload: (files: FileList | null) => void;
		onRefresh: () => void;
	}

	let { source, entries, busy, selectedId, onSource, onSelect, onUpload, onRefresh }: Props =
		$props();
</script>

<div class="space-y-3">
	<div class="flex flex-wrap gap-2">
		{#each FIRMWARE_SOURCES as src (src.id)}
			<button
				type="button"
				class="rounded-lg border px-3 py-1.5 text-sm transition-colors {source === src.id
					? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
					: 'border-zinc-200 dark:border-zinc-800'}"
				onclick={() => onSource(src.id)}
			>
				{$t(`tools.rnode_flasher.source_${src.id.replace(/-/g, '_')}`)}
				{#if src.comingSoon}
					<span class="ml-1 text-[10px] uppercase opacity-70"
						>{$t('tools.rnode_flasher.coming_soon')}</span
					>
				{/if}
			</button>
		{/each}
		<button
			type="button"
			class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-800"
			onclick={onRefresh}
			disabled={busy}
		>
			{#if busy}
				<LoaderCircle class="h-3.5 w-3.5 animate-spin" />
			{:else}
				<Download class="h-3.5 w-3.5" />
			{/if}
			{$t('tools.rnode_flasher.refresh_catalog')}
		</button>
	</div>

	{#if source === 'upload'}
		<label
			class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-sm dark:border-zinc-700"
		>
			<Upload class="h-6 w-6 text-[#00ADD8]" />
			<span>{$t('tools.rnode_flasher.upload_hint')}</span>
			<input
				type="file"
				accept=".bin,.zip,application/octet-stream,application/zip"
				class="sr-only"
				onchange={(e) => onUpload((e.currentTarget as HTMLInputElement).files)}
			/>
		</label>
	{:else if source === 'tiny-reticulum-go'}
		<div
			class="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400"
		>
			{$t('tools.rnode_flasher.tiny_coming_soon')}
		</div>
	{:else}
		<ul
			class="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
		>
			{#each entries.filter((e) => e.source === source) as entry (entry.id)}
				<li>
					<button
						type="button"
						class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 {selectedId ===
						entry.id
							? 'bg-[#00ADD8]/10'
							: ''}"
						disabled={!entry.available || entry.comingSoon || busy}
						onclick={() => onSelect(entry)}
					>
						<span>
							<span class="font-medium">{entry.name}</span>
							<span class="mt-0.5 block text-xs text-zinc-500"
								>{entry.boardLabel} · {entry.chip} · {entry.version}</span
							>
						</span>
						{#if entry.comingSoon || !entry.available}
							<span class="text-xs uppercase text-zinc-500"
								>{$t('tools.rnode_flasher.coming_soon')}</span
							>
						{/if}
					</button>
				</li>
			{:else}
				<li class="px-4 py-6 text-sm text-zinc-500">
					{#if busy}
						<span class="inline-flex items-center gap-2">
							<LoaderCircle class="h-4 w-4 animate-spin" />
							{$t('tools.rnode_flasher.working')}
						</span>
					{:else}
						{$t('tools.rnode_flasher.catalog_empty')}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
