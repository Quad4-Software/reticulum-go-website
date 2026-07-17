<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { t } from 'svelte-i18n';
	import FlasherApp from '$lib/components/rnode-flasher/FlasherApp.svelte';
</script>

<svelte:head>
	<title>{$t('tools.rnode_flasher.page_title')} | Reticulum-Go</title>
	<meta name="description" content={$t('tools.rnode_flasher.page_blurb')} />
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6">
	<div class="space-y-2">
		<a
			href="/tools"
			class="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-[#00ADD8] dark:text-zinc-400"
		>
			<ArrowLeft class="h-4 w-4" />
			<span>{$t('tools.rnode_flasher.back')}</span>
		</a>
		<div class="flex flex-wrap items-center gap-2">
			<h1 class="text-3xl font-extrabold tracking-tight md:text-4xl">
				{$t('tools.rnode_flasher.page_title')}
			</h1>
			<span class="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
				{$t('common.alpha')}
			</span>
		</div>
		<p class="max-w-2xl text-zinc-600 dark:text-zinc-400">{$t('tools.rnode_flasher.page_blurb')}</p>
	</div>

	<FlasherApp />
</div>
