<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import { browser } from '$app/environment';
	import {
		ArrowLeft,
		Download,
		ExternalLink,
		Sparkles,
		ChevronRight,
		BookOpen,
		Archive,
		FlaskConical
	} from 'lucide-svelte';
	import { RETICULUM_GO_GITHUB, RETICULUM_GO_SOURCE_ZIP_PATH } from '$lib/source-mirrors';
	import {
		RG_DOWNLOAD_SLOTS,
		RETICULUM_GO_RELEASES_REPO,
		detectClientPlatform,
		slotAssets,
		slotsForRelease,
		findExampleAssets,
		findSbomAssets,
		formatDownloadSize,
		type RgDownloadSlotId,
		type RgRelease
	} from '$lib/reticulum-go-download';

	let { data } = $props();

	let detectedPlatform = $state<RgDownloadSlotId | 'unknown'>('unknown');
	let activePlatform = $state<RgDownloadSlotId>('linux_amd64');

	const stable = $derived(data.releases?.stable ?? null);
	const nightly = $derived(data.releases?.nightly ?? null);
	const visibleSlots = $derived(slotsForRelease(stable, RG_DOWNLOAD_SLOTS));
	const visibleNightlySlots = $derived(slotsForRelease(nightly, RG_DOWNLOAD_SLOTS));
	const examples = $derived(findExampleAssets(stable));
	const sboms = $derived(findSbomAssets(stable));

	onMount(() => {
		const platform = detectClientPlatform(navigator.userAgent);
		detectedPlatform = platform;
		const slots = slotsForRelease(stable, RG_DOWNLOAD_SLOTS);
		if (platform !== 'unknown') {
			const slotIds = slots.map((slot) => slot.id);
			activePlatform = slotIds.includes(platform) ? platform : (slotIds[0] ?? activePlatform);
		}
	});

	function releaseNotesUrl(release: RgRelease | null): string {
		return release?.htmlUrl ?? `${RETICULUM_GO_RELEASES_REPO}/releases/latest`;
	}

	function formatDate(iso: string | undefined): string {
		if (!iso || !browser) return '';
		try {
			return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
		} catch {
			return iso.slice(0, 10);
		}
	}
</script>

<svelte:head>
	<title>{$t('reticulum_download.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('reticulum_download.subtitle')} />
</svelte:head>

<div class="max-w-5xl mx-auto space-y-10 pb-8">
	<div class="space-y-5">
		<div class="space-y-3">
			<a
				href="/"
				class="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-[#00ADD8] transition-colors"
			>
				<ArrowLeft class="w-4 h-4" />
				{$t('reticulum_download.back')}
			</a>
			<div class="space-y-2">
				<h1 class="text-4xl md:text-5xl font-extrabold tracking-tight">
					{$t('reticulum_download.title')}
				</h1>
				<p class="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
					{$t('reticulum_download.subtitle')}
				</p>
			</div>
		</div>

		{#if detectedPlatform !== 'unknown'}
			{@const slot = RG_DOWNLOAD_SLOTS.find((entry) => entry.id === detectedPlatform)}
			{@const picked = slot ? slotAssets(stable, slot) : { primary: null, alternates: [] }}
			{#if slot && picked.primary}
				<section
					class="rounded-2xl border-2 border-[#00ADD8]/40 bg-gradient-to-br from-[#00ADD8]/10 via-transparent to-transparent p-6 md:p-8 space-y-4"
				>
					<div class="flex items-center gap-2 text-[#00ADD8]">
						<Sparkles class="w-5 h-5" />
						<p class="text-sm font-bold uppercase tracking-wide">
							{$t('reticulum_download.recommended')}
						</p>
					</div>
					<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
						<div class="flex items-start gap-4">
							<div
								class="h-12 w-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0"
							>
								<img src={slot.icon} alt="" class="h-7 w-7 object-contain" />
							</div>
							<div class="space-y-1">
								<h2 class="text-2xl font-bold">{$t(slot.titleKey)}</h2>
								<p class="text-sm text-zinc-500 dark:text-zinc-400">{$t(slot.hintKey)}</p>
								{#if stable}
									<p class="text-xs text-zinc-400">
										{$t('reticulum_download.version_line', {
											values: { tag: stable.tag, date: formatDate(stable.publishedAt) }
										})}
									</p>
								{/if}
							</div>
						</div>
						<div class="flex flex-col items-stretch md:items-end gap-2">
							<a
								href={picked.primary.url}
								class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00ADD8] text-white font-bold hover:bg-[#00ADD8]/90 transition-colors"
							>
								<Download class="w-4 h-4" />
								{$t('reticulum_download.download_primary')}
							</a>
							<p class="text-xs text-zinc-500 text-center md:text-right font-mono">
								{picked.primary.name} · {formatDownloadSize(picked.primary.size)}
							</p>
						</div>
					</div>
				</section>
			{/if}
		{/if}

		<section class="space-y-4">
			<div class="flex flex-wrap gap-x-1.5 gap-y-1">
				{#each visibleSlots as slot (slot.id)}
					<button
						type="button"
						class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:text-sm font-medium transition-colors {activePlatform ===
						slot.id
							? 'border-[#00ADD8] bg-[#00ADD8]/10 text-[#00ADD8]'
							: 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}"
						onclick={() => {
							activePlatform = slot.id;
						}}
					>
						<img src={slot.icon} alt="" class="h-4 w-4 object-contain" />
						{$t(slot.titleKey)}
					</button>
				{/each}
			</div>

			<div class="space-y-6">
				<div class="space-y-2">
					<h2 class="text-2xl md:text-3xl font-bold">{$t('reticulum_download.latest_title')}</h2>
					{#if stable}
						<p class="text-zinc-600 dark:text-zinc-400">
							{$t('reticulum_download.latest_description', { values: { tag: stable.tag } })}
						</p>
					{:else}
						<p class="text-zinc-600 dark:text-zinc-400">
							{$t('reticulum_download.unavailable')}
						</p>
					{/if}
				</div>

				<div class="grid gap-4">
					{#each visibleSlots as slot (slot.id)}
						{@const picked = slotAssets(stable, slot)}
						{@const highlighted = activePlatform === slot.id || detectedPlatform === slot.id}
						<article
							id={`slot-${slot.id}`}
							class="rounded-2xl border p-5 md:p-6 transition-colors {highlighted
								? 'border-[#00ADD8]/50 bg-zinc-50/80 dark:bg-zinc-900/40'
								: 'border-zinc-200 dark:border-zinc-800'}"
						>
							<div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
								<div class="flex items-start gap-4 min-w-0">
									<div
										class="h-11 w-11 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0"
									>
										<img src={slot.icon} alt="" class="h-6 w-6 object-contain" />
									</div>
									<div class="space-y-1 min-w-0">
										<h3 class="text-lg font-bold">{$t(slot.titleKey)}</h3>
										<p class="text-sm text-zinc-500 dark:text-zinc-400">{$t(slot.hintKey)}</p>
									</div>
								</div>

								<div class="flex flex-col gap-3 lg:items-end lg:min-w-[18rem]">
									{#if picked.primary}
										<a
											href={picked.primary.url}
											class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00ADD8] text-white text-sm font-bold hover:bg-[#00ADD8]/90 transition-colors"
										>
											<Download class="w-4 h-4" />
											{$t('reticulum_download.download')}
										</a>
										<p class="text-xs text-zinc-500 font-mono break-all lg:text-right">
											{picked.primary.name} · {formatDownloadSize(picked.primary.size)}
										</p>
									{:else}
										<p class="text-sm text-zinc-500 italic">
											{$t('reticulum_download.not_available')}
										</p>
									{/if}
								</div>
							</div>

							{#if picked.alternates.length > 0}
								<div class="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
									<p class="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
										{$t('reticulum_download.alternate_formats')}
									</p>
									<ul class="flex flex-wrap gap-2">
										{#each picked.alternates as asset (asset.name)}
											<li>
												<a
													href={asset.url}
													class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-medium hover:border-[#00ADD8]/40 hover:text-[#00ADD8] transition-colors"
												>
													<span class="font-mono">{asset.name}</span>
													<span class="text-zinc-400">({formatDownloadSize(asset.size)})</span>
												</a>
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</article>
					{/each}
				</div>
			</div>
		</section>
	</div>

	{#if examples.length > 0}
		<section class="space-y-4">
			<div class="flex items-center gap-2">
				<FlaskConical class="w-5 h-5 text-[#00ADD8]" />
				<h2 class="text-xl md:text-2xl font-bold">{$t('reticulum_download.examples_title')}</h2>
			</div>
			<p class="text-sm text-zinc-500 dark:text-zinc-400">
				{$t('reticulum_download.examples_description')}
			</p>
			<ul class="flex flex-wrap gap-2">
				{#each examples as asset (asset.name)}
					<li>
						<a
							href={asset.url}
							class="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium hover:border-[#00ADD8]/40 hover:text-[#00ADD8] transition-colors"
						>
							<span class="font-mono">{asset.name}</span>
							<span class="text-zinc-400">({formatDownloadSize(asset.size)})</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<section class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-4">
		<div class="flex items-center gap-3">
			<Archive class="w-6 h-6 text-[#00ADD8]" />
			<h2 class="text-xl font-bold">{$t('reticulum_download.source_title')}</h2>
		</div>
		<p class="text-sm text-zinc-500 dark:text-zinc-400">
			{$t('reticulum_download.source_description')}
		</p>
		<div class="flex flex-wrap gap-3">
			<a
				href={RETICULUM_GO_SOURCE_ZIP_PATH}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
			>
				<Download class="w-4 h-4" />
				{$t('reticulum_download.source_zip')}
			</a>
			<a
				href="/source"
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
			>
				{$t('reticulum_download.source_page')}
			</a>
		</div>
	</section>

	<section class="space-y-6">
		<div class="space-y-2">
			<div class="flex items-center gap-2">
				<h2 class="text-2xl md:text-3xl font-bold">
					{$t('reticulum_download.nightly_title')}
				</h2>
				<span
					class="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300"
				>
					{$t('reticulum_download.nightly_badge')}
				</span>
			</div>
			<p class="text-zinc-600 dark:text-zinc-400">
				{#if nightly}
					{$t('reticulum_download.nightly_description', { values: { tag: nightly.tag } })}
				{:else}
					{$t('reticulum_download.nightly_empty')}
				{/if}
			</p>
		</div>

		{#if nightly}
			<div class="grid gap-4">
				{#each visibleNightlySlots as slot (slot.id)}
					{@const picked = slotAssets(nightly, slot)}
					{#if picked.primary || picked.alternates.length > 0}
						<article class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
							<h3 class="font-bold">{$t(slot.titleKey)}</h3>
							{#if picked.primary}
								<a
									href={picked.primary.url}
									class="inline-flex items-center gap-2 text-sm font-bold text-[#00ADD8] hover:underline"
								>
									<Download class="w-4 h-4" />
									{picked.primary.name}
									<span class="text-zinc-400 font-normal">
										({formatDownloadSize(picked.primary.size)})
									</span>
								</a>
							{/if}
							{#if picked.alternates.length > 0}
								<ul class="flex flex-wrap gap-2">
									{#each picked.alternates as asset (asset.name)}
										<li>
											<a
												href={asset.url}
												class="text-xs font-mono text-zinc-500 hover:text-[#00ADD8]"
											>
												{asset.name}
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</article>
					{/if}
				{/each}
			</div>
		{:else}
			<div
				class="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-sm text-zinc-500"
			>
				{$t('reticulum_download.nightly_none')}
			</div>
		{/if}
	</section>

	<section
		class="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-5 text-sm text-zinc-600 dark:text-zinc-400"
	>
		<p class="text-xs text-zinc-500">{$t('reticulum_download.privacy_note')}</p>
		<div class="grid md:grid-cols-2 gap-4">
			<a
				href={RETICULUM_GO_GITHUB}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 font-bold text-[#00ADD8] hover:underline"
			>
				<ExternalLink class="w-4 h-4" />
				{$t('reticulum_download.view_source')}
			</a>
			<a
				href={releaseNotesUrl(stable)}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 font-bold text-[#00ADD8] hover:underline"
			>
				<ExternalLink class="w-4 h-4" />
				{$t('reticulum_download.release_notes')}
			</a>
			<a
				href="/docs/overview"
				class="inline-flex items-center gap-2 font-bold text-[#00ADD8] hover:underline"
			>
				<BookOpen class="w-4 h-4" />
				{$t('reticulum_download.docs')}
			</a>
			<a
				href="/wasm-example"
				class="inline-flex items-center gap-2 font-bold text-[#00ADD8] hover:underline"
			>
				<FlaskConical class="w-4 h-4" />
				{$t('reticulum_download.wasm_demo')}
			</a>
		</div>
		{#if sboms.length > 0}
			<div class="space-y-2">
				<p class="text-xs font-semibold uppercase tracking-wide text-zinc-500">
					{$t('reticulum_download.sbom_title')}
				</p>
				<ul class="flex flex-wrap gap-2">
					{#each sboms as asset (asset.name)}
						<li>
							<a href={asset.url} class="font-mono text-[#00ADD8] hover:underline text-xs">
								{asset.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
		<p class="text-xs text-zinc-500">{$t('reticulum_download.footer_note')}</p>
		<a
			href="/"
			class="inline-flex items-center gap-1 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:text-[#00ADD8]"
		>
			{$t('reticulum_download.back_home')}
			<ChevronRight class="w-4 h-4" />
		</a>
	</section>
</div>
