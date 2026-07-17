<script lang="ts">
	import {
		AlertTriangle,
		Check,
		Cpu,
		Download,
		FlaskConical,
		LoaderCircle,
		Radio,
		Usb
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import {
		FlasherSession,
		boardById,
		filterCatalog,
		getSeedCatalog,
		loadBundledCatalog,
		loadCatalogArtifact,
		parseFirmwareFile,
		type CatalogEntry,
		type FirmwareCatalog,
		type FirmwareSourceId,
		type SessionSnapshot,
		type TransportKind
	} from '$lib/rnode-flasher';
	import FirmwarePicker from './FirmwarePicker.svelte';
	import TransportPicker from './TransportPicker.svelte';
	import FlashProgress from './FlashProgress.svelte';
	import ProvisionPanel from './ProvisionPanel.svelte';
	import SerialLog from './SerialLog.svelte';
	import PermissionGate from './PermissionGate.svelte';
	import SupportedBrowsers from './SupportedBrowsers.svelte';

	const session = new FlasherSession();
	let snap: SessionSnapshot = $state(session.snapshot());
	let catalog: FirmwareCatalog = $state(getSeedCatalog());
	let catalogError = $state('');
	let source = $state<FirmwareSourceId>('official');
	let busy = $state(false);
	let ipHost = $state('127.0.0.1');
	let ipPort = $state(4030);
	let offline = $state(false);
	let lastCatalogAt = $state(0);
	let catalogRefreshing = $state(false);

	const CATALOG_STALE_MS = 5 * 60 * 1000;

	function catalogBusyPhase(): boolean {
		return snap.phase === 'flash' || snap.phase === 'verify' || snap.phase === 'connect';
	}

	function shouldAutoRefreshCatalog(): boolean {
		if (catalogBusyPhase()) return false;
		if (catalogError) return true;
		if (!catalog.entries.length) return true;
		if (lastCatalogAt === 0) return true;
		return Date.now() - lastCatalogAt >= CATALOG_STALE_MS;
	}

	async function refreshCatalog(force = false) {
		if (catalogRefreshing) return;
		if (!force && !shouldAutoRefreshCatalog()) return;
		catalogRefreshing = true;
		catalogError = '';
		try {
			catalog = await loadBundledCatalog({ bustCache: force });
			lastCatalogAt = Date.now();
		} catch (err) {
			catalogError = err instanceof Error ? err.message : String(err);
			if (!catalog.entries.length) {
				catalog = getSeedCatalog();
			}
		} finally {
			catalogRefreshing = false;
		}
	}

	function maybeRefreshCatalog() {
		void refreshCatalog(false);
	}

	function selectSource(id: FirmwareSourceId) {
		source = id;
		if (id !== 'upload') maybeRefreshCatalog();
	}

	onMount(() => {
		offline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

		const unsub = session.subscribe((s) => {
			snap = s;
		});
		const onOnline = () => {
			offline = false;
			void refreshCatalog(true);
		};
		const onOffline = () => (offline = true);
		const onVisible = () => {
			if (document.visibilityState === 'visible') maybeRefreshCatalog();
		};
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		document.addEventListener('visibilitychange', onVisible);
		void refreshCatalog(true);
		return () => {
			unsub();
			void session.disconnect();
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	let entries = $derived(filterCatalog(catalog, source === 'upload' ? undefined : source));

	async function pickCatalogEntry(entry: CatalogEntry) {
		busy = true;
		try {
			const artifact = await loadCatalogArtifact(entry);
			session.selectFirmware(artifact);
		} catch (err) {
			catalogError = err instanceof Error ? err.message : String(err);
		} finally {
			busy = false;
		}
	}

	async function onUpload(files: FileList | null) {
		const file = files?.[0];
		if (!file) return;
		busy = true;
		try {
			const artifact = await parseFirmwareFile(file);
			session.selectFirmware(artifact);
		} catch (err) {
			catalogError = err instanceof Error ? err.message : String(err);
		} finally {
			busy = false;
		}
	}

	async function connect(kind: TransportKind) {
		busy = true;
		try {
			await session.connect(kind, kind === 'ip' ? { host: ipHost, port: ipPort } : {});
		} catch {
			/* session stores error */
		} finally {
			busy = false;
		}
	}

	async function runFlash() {
		busy = true;
		try {
			await session.flash();
		} catch {
			/* session stores error */
		} finally {
			busy = false;
		}
	}

	async function runProvision() {
		busy = true;
		try {
			await session.runProvision();
		} catch {
			/* session stores error */
		} finally {
			busy = false;
		}
	}

	const board = $derived(snap.firmware ? boardById(snap.firmware.boardId) : undefined);
</script>

<div class="space-y-6">
	{#if offline}
		<div
			class="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
			role="status"
		>
			<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
			<p>{$t('tools.rnode_flasher.offline_banner')}</p>
		</div>
	{/if}

	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<Radio class="h-5 w-5 text-[#00ADD8]" />
			<h2 class="text-lg font-semibold">{$t('tools.rnode_flasher.step_firmware')}</h2>
		</div>
		<FirmwarePicker
			{source}
			{entries}
			busy={busy || catalogRefreshing}
			selectedId={snap.firmware?.id ?? null}
			onSource={selectSource}
			onSelect={pickCatalogEntry}
			{onUpload}
			onRefresh={() => refreshCatalog(true)}
		/>
		{#if catalogError}
			<p class="text-sm text-red-600 dark:text-red-400">{catalogError}</p>
		{/if}
		{#if snap.firmware}
			<div
				class="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900/60"
			>
				<Cpu class="h-4 w-4 text-[#00ADD8]" />
				<span class="font-medium">{snap.firmware.boardLabel}</span>
				<span class="text-zinc-500">{snap.firmware.chip}</span>
				<span class="text-zinc-500">{snap.firmware.version}</span>
				{#if board?.dfuHint}
					<span class="w-full text-zinc-600 dark:text-zinc-400">{board.dfuHint}</span>
				{/if}
			</div>
		{/if}
	</section>

	<section class="space-y-3">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<Usb class="h-5 w-5 text-[#00ADD8]" />
				<h2 class="text-lg font-semibold">{$t('tools.rnode_flasher.step_transport')}</h2>
			</div>
			<SupportedBrowsers />
		</div>
		<PermissionGate />
		<TransportPicker
			disabled={!snap.firmware || busy}
			connected={snap.connected}
			selected={snap.transportKind}
			{ipHost}
			{ipPort}
			onIpHost={(v) => (ipHost = v)}
			onIpPort={(v) => (ipPort = v)}
			onConnect={connect}
			onDisconnect={() => session.disconnect()}
		/>
	</section>

	<section class="space-y-3">
		<div class="flex items-center gap-2">
			<Download class="h-5 w-5 text-[#00ADD8]" />
			<h2 class="text-lg font-semibold">{$t('tools.rnode_flasher.step_flash')}</h2>
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg bg-[#00ADD8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
				disabled={!snap.connected || busy || !snap.firmware}
				onclick={runFlash}
			>
				{#if busy && snap.phase === 'flash'}
					<LoaderCircle class="h-4 w-4 animate-spin" />
				{:else}
					<Download class="h-4 w-4" />
				{/if}
				{$t('tools.rnode_flasher.flash_button')}
			</button>
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
				disabled={snap.phase !== 'flash'}
				onclick={() => session.abortFlash()}
			>
				{$t('tools.rnode_flasher.abort_button')}
			</button>
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
				onclick={() => session.reset()}
			>
				{$t('tools.rnode_flasher.reset_button')}
			</button>
		</div>
		<FlashProgress progress={snap.progress} phase={snap.phase} identity={snap.identity} />
	</section>

	{#if snap.phase === 'provision' || snap.phase === 'done' || snap.provision}
		<section class="space-y-3">
			<div class="flex items-center gap-2">
				<Check class="h-5 w-5 text-[#00ADD8]" />
				<h2 class="text-lg font-semibold">{$t('tools.rnode_flasher.step_provision')}</h2>
			</div>
			<ProvisionPanel
				result={snap.provision}
				{busy}
				canRun={snap.phase === 'provision'}
				onProvision={runProvision}
				onSkip={() => session.skipProvision()}
			/>
		</section>
	{/if}

	{#if snap.error}
		<div
			class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
			role="alert"
		>
			<p class="font-semibold">{snap.error.message}</p>
			{#if snap.error.detail}
				<p class="mt-1 opacity-80">{snap.error.detail}</p>
			{/if}
			{#if snap.error.suggestion}
				<p class="mt-2">{$t('tools.rnode_flasher.suggestion_prefix')}: {snap.error.suggestion}</p>
			{/if}
		</div>
	{/if}

	{#if snap.phase === 'done'}
		<div
			class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100"
		>
			<p class="font-semibold">{$t('tools.rnode_flasher.done_title')}</p>
			<p class="mt-1">{$t('tools.rnode_flasher.done_blurb')}</p>
		</div>
	{/if}

	<SerialLog logs={snap.logs} />

	<p class="flex items-center gap-2 text-xs text-zinc-500">
		<FlaskConical class="h-3.5 w-3.5" />
		{$t('tools.rnode_flasher.sim_hint')}
	</p>
</div>
