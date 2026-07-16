<script lang="ts">
	import { t } from 'svelte-i18n';
	import { jsonLdScript, getDonateWebPageJsonLd, RETICULUM_SITE } from '$lib/seo';

	const BMC = 'https://buymeacoffee.com/quad4';
	const LIBERAPAY = 'https://liberapay.com/Quad4/';
	const KOFI = 'https://ko-fi.com/quad4';

	const MONERO_ADDRESS =
		'8AfDSLVeTSt1oku5ifK4jkbJ94fp5kW6y5RWxuP1FYmyZmLHYRVSrPXJJaX7mK1n7MQUzwYE15uVdQVeAuWWnR5pDkN52xU';

	let copiedMonero = $state(false);

	async function copyMonero() {
		try {
			await navigator.clipboard.writeText(MONERO_ADDRESS);
			copiedMonero = true;
			setTimeout(() => {
				copiedMonero = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy Monero address:', err);
		}
	}
</script>

<svelte:head>
	<title>{$t('donate.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('donate.meta_description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reticulum-go.quad4.io/donate" />
	<meta property="og:title" content="{$t('donate.title')} | Reticulum-Go" />
	<meta property="og:description" content={$t('donate.meta_description')} />
	<meta property="og:image" content="https://reticulum-go.quad4.io/logo.svg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{$t('donate.title')} | Reticulum-Go" />
	<meta name="twitter:description" content={$t('donate.meta_description')} />
	{@html jsonLdScript(getDonateWebPageJsonLd())}
</svelte:head>

<div class="max-w-3xl mx-auto space-y-12 py-12">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">{$t('donate.title')}</h1>
		<p class="text-xl text-zinc-600 dark:text-zinc-400">
			{$t('donate.subtitle')}
		</p>
	</div>

	<div
		class="rounded-2xl border border-[#00ADD8]/30 bg-[#00ADD8]/5 p-5 text-center dark:border-[#00ADD8]/40 dark:bg-[#00ADD8]/10"
	>
		<p class="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
			{$t('donate.markqvist_share')}
			<a
				href={RETICULUM_SITE}
				target="_blank"
				rel="noopener noreferrer"
				class="font-semibold text-[#00ADD8] hover:underline"
			>
				{$t('donate.markqvist_link')}
			</a>
		</p>
	</div>

	<div
		class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-8"
	>
		<p class="text-lg leading-relaxed text-zinc-700 dark:text-zinc-300">
			{$t('donate.intro')}
		</p>

		<div class="grid gap-4 sm:grid-cols-3">
			<a
				href={BMC}
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-6 text-center font-semibold text-zinc-900 shadow-sm transition hover:border-[#00ADD8]/50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			>
				{$t('donate.buymeacoffee')}
			</a>
			<a
				href={LIBERAPAY}
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-6 text-center font-semibold text-zinc-900 shadow-sm transition hover:border-[#00ADD8]/50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			>
				{$t('donate.liberapay')}
			</a>
			<a
				href={KOFI}
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-6 text-center font-semibold text-zinc-900 shadow-sm transition hover:border-[#00ADD8]/50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			>
				{$t('donate.kofi')}
			</a>
		</div>

		<div
			class="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900/80"
		>
			<h2
				class="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
			>
				{$t('donate.monero')}
			</h2>
			<code
				class="mb-4 block break-all font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
				>{MONERO_ADDRESS}</code
			>
			<button
				type="button"
				onclick={copyMonero}
				class="inline-flex items-center gap-2 rounded-lg bg-[#00ADD8] px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-[#0096bc] active:scale-[0.98]"
			>
				{#if copiedMonero}
					{$t('donate.copied')}
				{:else}
					{$t('donate.copy_address')}
				{/if}
			</button>
		</div>
	</div>
</div>
