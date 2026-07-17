<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Shield } from 'lucide-svelte';
	import { jsonLdScript, getPrivacyWebPageJsonLd } from '$lib/seo';
</script>

<svelte:head>
	<title>{$t('privacy.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('privacy.meta_description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reticulum-go.quad4.io/privacy" />
	<meta property="og:title" content="{$t('privacy.title')} | Reticulum-Go" />
	<meta property="og:description" content={$t('privacy.meta_description')} />
	<meta property="og:image" content="https://reticulum-go.quad4.io/logo.svg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{$t('privacy.title')} | Reticulum-Go" />
	<meta name="twitter:description" content={$t('privacy.meta_description')} />
	{@html jsonLdScript(getPrivacyWebPageJsonLd())}
</svelte:head>

<div class="max-w-3xl mx-auto space-y-12 py-12">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">{$t('privacy.title')}</h1>
		<p class="text-xl text-zinc-600 dark:text-zinc-400">
			{$t('privacy.subtitle')}
		</p>
	</div>

	<div
		class="rounded-2xl border border-[#00ADD8]/30 bg-[#00ADD8]/5 p-5 text-center dark:border-[#00ADD8]/40 dark:bg-[#00ADD8]/10"
	>
		<div class="mb-3 flex justify-center text-[#00ADD8]">
			<Shield class="h-8 w-8" aria-hidden="true" />
		</div>
		<p class="text-base leading-relaxed text-zinc-800 dark:text-zinc-200">
			{$t('privacy.summary')}
		</p>
	</div>

	<div
		class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-8"
	>
		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.no_analytics.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.no_analytics.body')}
			</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.no_accounts.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.no_accounts.body')}
			</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.local_processing.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.local_processing.body')}
			</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.cookies.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.cookies.body')}
			</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.third_parties.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.third_parties.body')}
			</p>
		</section>

		<section class="space-y-2">
			<h2 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
				{$t('privacy.contact.title')}
			</h2>
			<p class="leading-relaxed text-zinc-700 dark:text-zinc-300">
				{$t('privacy.contact.body')}
				<a href="/contact" class="font-semibold text-[#00ADD8] hover:underline">/contact</a>
				{$t('privacy.contact.or')}
				<a href="mailto:team@quad4.io" class="font-semibold text-[#00ADD8] hover:underline"
					>team@quad4.io</a
				>
			</p>
		</section>

		<p class="text-sm text-zinc-500 dark:text-zinc-400">
			{$t('privacy.updated')}
		</p>
	</div>
</div>
