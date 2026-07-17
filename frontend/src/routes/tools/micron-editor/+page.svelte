<script lang="ts">
	import { ArrowLeft, ExternalLink } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import { page } from '$app/state';
	import MicronEditor from '$lib/components/MicronEditor.svelte';

	const isPopout = $derived(page.url.searchParams.get('popout') === '1');
</script>

<svelte:head>
	<title>Micron Editor | Reticulum-Go</title>
	<meta
		name="description"
		content="Live Micron markup editor with WASM preview via Micron-Parser-Go."
	/>
</svelte:head>

{#if isPopout}
	<div class="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden">
		<MicronEditor popout />
	</div>
{:else}
	<div class="flex min-w-0 flex-col gap-3 md:-mt-4 md:gap-2 lg:-mt-6">
		<div class="min-w-0 shrink-0 space-y-1.5">
			<a
				href="/tools"
				class="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-[#00ADD8] dark:text-zinc-400"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>{$t('tools.micron_editor.back')}</span>
			</a>

			<div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
				<div class="flex flex-wrap items-center gap-2">
					<h1 class="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
						{$t('tools.micron_editor.page_title')}
					</h1>
					<span
						class="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
					>
						{$t('common.alpha')}
					</span>
				</div>
				<a
					href="https://github.com/Quad4-Software/Micron-Parser-Go"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 text-sm font-medium text-[#00ADD8] hover:underline"
				>
					<span>{$t('tools.micron_editor.powered_by')}</span>
					<ExternalLink class="h-3.5 w-3.5" />
				</a>
			</div>
			<p class="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 md:line-clamp-1 md:text-base">
				{$t('tools.micron_editor.page_blurb')}
			</p>
		</div>

		<div class="min-h-0 min-w-0 md:flex-1">
			<MicronEditor />
		</div>
	</div>
{/if}
