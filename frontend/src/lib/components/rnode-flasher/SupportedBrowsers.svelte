<script lang="ts">
	import { t } from 'svelte-i18n';

	const browsers = [
		{
			id: 'chrome',
			src: '/browser-icons/chrome.svg',
			nameKey: 'tools.rnode_flasher.browser_chrome'
		},
		{ id: 'edge', src: '/browser-icons/edge.svg', nameKey: 'tools.rnode_flasher.browser_edge' },
		{ id: 'brave', src: '/browser-icons/brave.svg', nameKey: 'tools.rnode_flasher.browser_brave' },
		{ id: 'opera', src: '/browser-icons/opera.svg', nameKey: 'tools.rnode_flasher.browser_opera' }
	] as const;
</script>

<div class="flex flex-wrap items-center gap-3">
	<span class="text-sm text-zinc-600 dark:text-zinc-400"
		>{$t('tools.rnode_flasher.supported_browsers')}</span
	>
	<ul class="flex items-center pl-0.5" aria-label={$t('tools.rnode_flasher.supported_browsers')}>
		{#each browsers as browser, i (browser.id)}
			<li
				class="relative"
				style={`z-index: ${browsers.length - i}; margin-left: ${i === 0 ? '0' : '-0.5rem'}`}
			>
				<span class="group relative inline-flex">
					<span
						class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100/90 p-1.5 shadow-sm ring-2 ring-white transition-transform group-hover:z-20 group-hover:-translate-y-0.5 group-hover:scale-110 dark:bg-zinc-800 dark:ring-zinc-950"
					>
						<img
							src={browser.src}
							alt=""
							width="20"
							height="20"
							class="h-5 w-5"
							title={$t(browser.nameKey)}
						/>
					</span>
					<span
						class="pointer-events-none absolute -bottom-7 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
						role="tooltip"
					>
						{$t(browser.nameKey)}
					</span>
				</span>
			</li>
		{/each}
	</ul>
</div>
