<script lang="ts">
	import { ArrowLeft, ExternalLink } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import MicronEditor from '$lib/components/MicronEditor.svelte';
</script>

<svelte:head>
	<title>Micron Editor | Reticulum-Go</title>
	<meta
		name="description"
		content="Live Micron markup editor with WASM preview via Micron-Parser-Go."
	/>
</svelte:head>

<div class="space-y-8">
	<div class="space-y-4">
		<a
			href="/tools"
			class="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-[#00ADD8] transition-colors"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{$t('tools.micron_editor.back')}</span>
		</a>

		<div class="space-y-3">
			<div class="flex flex-wrap items-center gap-3">
				<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
					{$t('tools.micron_editor.page_title')}
				</h1>
				<span class="px-2 py-1 text-[10px] font-semibold rounded uppercase bg-amber-500 text-white">
					{$t('common.alpha')}
				</span>
			</div>
			<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl">
				{$t('tools.micron_editor.page_blurb')}
			</p>
			<a
				href="https://github.com/Quad4-Software/Micron-Parser-Go"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 text-sm font-medium text-[#00ADD8] hover:underline"
			>
				<span>{$t('tools.micron_editor.powered_by')}</span>
				<ExternalLink class="h-4 w-4" />
			</a>
		</div>
	</div>

	<MicronEditor />
</div>
