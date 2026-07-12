<script lang="ts">
	import { Calendar, ChevronDown, FileText, Hash, Tag, User } from 'lucide-svelte';
	import type { DocMetaField } from '$lib/doc-meta';

	let {
		fields = [] as DocMetaField[]
	} = $props();

	const version = $derived(
		fields.find((f) => /^document\s*version$/i.test(f.label))?.value
	);
	const updated = $derived(
		fields.find((f) => /^last\s*updated$/i.test(f.label))?.value
	);

	type FieldIcon = typeof Hash;

	function iconFor(label: string): FieldIcon | null {
		const key = label.trim().toLowerCase();
		if (key === 'document version' || key === 'version') return Hash;
		if (key === 'last updated' || key === 'updated') return Calendar;
		if (key === 'author') return User;
		if (key.includes('protocol') || key.includes('target')) return Tag;
		return null;
	}
</script>

{#if fields.length > 0}
	<details
		class="not-prose group my-4 rounded-lg border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/60"
	>
		<summary
			class="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 [&::-webkit-details-marker]:hidden"
		>
			<FileText class="h-3.5 w-3.5 shrink-0 text-[#00ADD8]" aria-hidden="true" />
			<span class="font-medium">Document info</span>
			{#if version}
				<span
					class="rounded-full bg-[#00ADD8]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#00ADD8]"
				>
					v{version}
				</span>
			{/if}
			{#if updated}
				<span class="text-xs text-zinc-500 dark:text-zinc-400">{updated}</span>
			{/if}
			<ChevronDown
				class="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
				aria-hidden="true"
			/>
		</summary>
		<div class="border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
			<dl class="grid gap-2 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-4 sm:gap-y-1.5">
				{#each fields as field (field.label)}
					{@const Icon = iconFor(field.label)}
					<div class="contents">
						<dt
							class="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
						>
							{#if Icon}
								<Icon class="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
							{/if}
							{field.label}
						</dt>
						<dd class="text-sm text-zinc-800 dark:text-zinc-200">{field.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</details>
{/if}
