<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Copy, Check, ExternalLink, Download } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';
	import {
		jsonLdScript,
		getSourceWebPageJsonLd,
		getBreadcrumbJsonLd,
		getCanonicalUrl
	} from '$lib/seo';
	import {
		RETICULUM_GO_GITHUB,
		RETICULUM_GO_LAVAFORGE,
		RETICULUM_GO_RNS_CLONE,
		RETICULUM_GO_RNGIT_PAGE,
		RETICULUM_GO_SOURCE_ZIP_PATH
	} from '$lib/source-mirrors';

	let { data } = $props();

	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let copiedKey = $state<string | null>(null);

	function showToast(message: string) {
		toastMessage = message;
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastVisible = false;
			toastTimer = null;
		}, 2500);
	}

	async function copyText(key: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			copiedKey = key;
			showToast($t('source.copied_toast'));
			setTimeout(() => {
				if (copiedKey === key) copiedKey = null;
			}, 1500);
		} catch (err) {
			console.error('Failed to copy:', err);
			showToast($t('source.copy_failed'));
		}
	}

	const breadcrumbLd = getBreadcrumbJsonLd([
		{ name: 'Home', url: getCanonicalUrl('/') },
		{ name: 'Source', url: getCanonicalUrl('/source') }
	]);
</script>

<svelte:head>
	<title>{$t('source.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('source.meta_description')} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://reticulum-go.quad4.io/source" />
	<meta property="og:title" content="{$t('source.title')} | Reticulum-Go" />
	<meta property="og:description" content={$t('source.meta_description')} />
	<meta property="og:image" content="https://reticulum-go.quad4.io/logo.svg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{$t('source.title')} | Reticulum-Go" />
	<meta name="twitter:description" content={$t('source.meta_description')} />
	{@html jsonLdScript(getSourceWebPageJsonLd())}
	{@html jsonLdScript(breadcrumbLd)}
</svelte:head>

<div class="max-w-3xl mx-auto space-y-10 pt-0 pb-4">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold tracking-tight">{$t('source.title')}</h1>
		<p class="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
			{$t('source.subtitle')}
		</p>
		<p class="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
			{$t('source.intro')}
		</p>
		<div class="flex flex-col items-center gap-2 pt-1">
			<a
				href={RETICULUM_GO_SOURCE_ZIP_PATH}
				class="inline-flex items-center gap-2 rounded-lg bg-[#00ADD8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0099c0]"
			>
				<Download class="h-4 w-4" />
				{$t('source.download_zip')}
			</a>
			{#if data.zipTag}
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					{$t('source.download_zip_tag', { values: { tag: data.zipTag } })}
				</p>
			{:else if !data.zipAvailable}
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					{$t('source.download_zip_pending')}
				</p>
			{/if}
		</div>
	</div>

	<ul class="space-y-4">
		<li
			class="rounded-2xl border border-[#00ADD8]/35 bg-[#00ADD8]/5 p-5 md:p-6 dark:border-[#00ADD8]/40 dark:bg-[#00ADD8]/10"
		>
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start">
				<span
					class="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
				>
					<img
						src="/source-icons/reticulum.png"
						alt=""
						width="64"
						height="64"
						class="h-16 w-16 object-contain"
					/>
				</span>
				<div class="min-w-0 flex-1 space-y-4">
					<div class="space-y-2">
						<div class="flex flex-wrap items-center gap-2">
							<h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
								{$t('source.rngit.title')}
							</h2>
							<span
								class="rounded-md bg-[#00ADD8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
								>{$t('source.badge_official')}</span
							>
						</div>
						<p class="text-sm text-zinc-600 dark:text-zinc-400">
							{$t('source.rngit.description')}
						</p>
					</div>

					<div class="space-y-2">
						<p
							class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
						>
							{$t('source.rngit.git_label')}
						</p>
						<button
							type="button"
							onclick={() => copyText('clone', RETICULUM_GO_RNS_CLONE)}
							class="group relative flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-[#00ADD8]/50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-[#00ADD8]/40"
							aria-label={$t('source.copy_clone')}
						>
							<code
								class="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200"
								>{RETICULUM_GO_RNS_CLONE}</code
							>
							<span
								class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-zinc-500"
								aria-hidden="true"
							>
								{#if copiedKey === 'clone'}
									<Check class="h-4 w-4 text-[#00ADD8]" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</span>
						</button>
					</div>

					<div class="space-y-2 border-t border-[#00ADD8]/20 pt-4 dark:border-[#00ADD8]/25">
						<p
							class="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
						>
							{$t('source.rngit.page_label')}
						</p>
						<p class="text-sm text-zinc-600 dark:text-zinc-400">
							{$t('source.rngit.page_blurb')}
						</p>
						<button
							type="button"
							onclick={() => copyText('page', RETICULUM_GO_RNGIT_PAGE)}
							class="group relative flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-[#00ADD8]/50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-[#00ADD8]/40"
							aria-label={$t('source.copy_path')}
						>
							<code
								class="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-zinc-800 dark:text-zinc-200"
								>{RETICULUM_GO_RNGIT_PAGE}</code
							>
							<span
								class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-400 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-zinc-500"
								aria-hidden="true"
							>
								{#if copiedKey === 'page'}
									<Check class="h-4 w-4 text-[#00ADD8]" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</span>
						</button>
						<a
							href="/ren-browser"
							class="inline-flex items-center gap-2 text-sm font-medium text-[#00ADD8] hover:underline"
						>
							{$t('source.open_ren')}
							<ExternalLink class="h-3.5 w-3.5" />
						</a>
					</div>
				</div>
			</div>
		</li>

		<li
			class="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
		>
			<a
				href={RETICULUM_GO_GITHUB}
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-col gap-4 sm:flex-row sm:items-start group"
			>
				<span
					class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 transition group-hover:ring-[#00ADD8]/50 dark:bg-zinc-900 dark:ring-zinc-700"
				>
					<img
						src="/source-icons/github.svg"
						alt=""
						width="28"
						height="28"
						class="h-7 w-7 object-contain"
					/>
				</span>
				<div class="min-w-0 flex-1 space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							{$t('source.github.title')}
						</h2>
						<span
							class="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
							>{$t('source.badge_mirror')}</span
						>
						<span
							class="rounded-md bg-[#00ADD8]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#007a99] dark:bg-[#00ADD8]/20 dark:text-[#7dd3e8]"
							>{$t('source.badge_ci_releases')}</span
						>
					</div>
					<p class="text-sm text-zinc-600 dark:text-zinc-400">
						{$t('source.github.description')}
					</p>
					<span class="inline-flex items-center gap-1.5 text-sm font-medium text-[#00ADD8]">
						{$t('source.open_link')}
						<ExternalLink class="h-3.5 w-3.5" />
					</span>
				</div>
			</a>
		</li>

		<li
			class="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-5 md:p-6 dark:border-zinc-800 dark:bg-zinc-900/50"
		>
			<a
				href={RETICULUM_GO_LAVAFORGE}
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-col gap-4 sm:flex-row sm:items-start group"
			>
				<span
					class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 transition group-hover:ring-[#00ADD8]/50 dark:bg-zinc-900 dark:ring-zinc-700"
				>
					<img
						src="/source-icons/lavaforge.svg"
						alt=""
						width="28"
						height="28"
						class="h-7 w-7 object-contain"
					/>
				</span>
				<div class="min-w-0 flex-1 space-y-2">
					<div class="flex flex-wrap items-center gap-2">
						<h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
							{$t('source.lavaforge.title')}
						</h2>
						<span
							class="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
							>{$t('source.badge_mirror')}</span
						>
					</div>
					<p class="text-sm text-zinc-600 dark:text-zinc-400">
						{$t('source.lavaforge.description')}
					</p>
					<span class="inline-flex items-center gap-1.5 text-sm font-medium text-[#00ADD8]">
						{$t('source.open_link')}
						<ExternalLink class="h-3.5 w-3.5" />
					</span>
				</div>
			</a>
		</li>
	</ul>
</div>

<Toast
	message={toastMessage}
	visible={toastVisible}
	showDot={false}
	ondismiss={() => {
		toastVisible = false;
	}}
/>
