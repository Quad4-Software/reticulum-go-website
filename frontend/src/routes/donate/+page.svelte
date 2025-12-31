<script lang="ts">
	import { t } from 'svelte-i18n';
</script>

<svelte:head>
	<title>{$t('donate.title')} | Reticulum-Go</title>
</svelte:head>

<div class="max-w-3xl mx-auto space-y-12 py-12">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">{$t('donate.title')}</h1>
		<p class="text-xl text-zinc-600 dark:text-zinc-400">
			{$t('donate.subtitle')}
		</p>
	</div>

	<div
		class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-6"
	>
		<p class="text-lg leading-relaxed">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html $t('donate.supported_by', {
				values: {
					quad4: `<a href="https://quad4.io" target="_blank" rel="noopener noreferrer" class="text-[#00ADD8] font-bold hover:underline">Quad4</a>`
				}
			})}
		</p>

		<p class="text-lg leading-relaxed">
			{$t('donate.no_direct_donations')}
		</p>

		<div class="pt-4 text-center">
			<a
				href="https://unsigned.io/donate.html"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-3 px-8 py-4 bg-[#00ADD8] text-white font-bold rounded-xl shadow-md hover:shadow-[#00ADD8]/10 transition-all active:scale-95"
			>
				{$t('donate.cta')}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					><path d="M15 3h6v6" /><path d="M10 14L21 3" /><path
						d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
					/></svg
				>
			</a>
		</div>
	</div>
</div>
