<script lang="ts">
	import { AlertTriangle, Bluetooth, Network, Usb } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { t } from 'svelte-i18n';
	import {
		bluetoothCapability,
		capabilityI18nKey,
		detectBrave,
		detectBrowserEngine,
		engineSupportNoteKey,
		ipCapability,
		looksLikeBrave,
		needsBraveEnableHelp,
		probeEnvironment,
		serialCapability
	} from '$lib/rnode-flasher';

	let serialCap = $derived(browser ? serialCapability() : 'unknown');
	let bluetoothCap = $derived(browser ? bluetoothCapability() : 'unknown');
	let ipCap = $derived(browser ? ipCapability() : 'unknown');
	let engineNoteKey = $derived(
		browser
			? engineSupportNoteKey(detectBrowserEngine(probeEnvironment().userAgent))
			: 'engine_note_other'
	);
	let isBrave = $state(browser ? looksLikeBrave(probeEnvironment()) : false);

	onMount(() => {
		void detectBrave().then((value) => {
			isBrave = value;
		});
	});

	let showBraveHelp = $derived(needsBraveEnableHelp(isBrave, serialCap, bluetoothCap));
	let braveNeedsSerial = $derived(isBrave && serialCap === 'unsupported');
	let braveNeedsBluetooth = $derived(isBrave && bluetoothCap === 'unsupported');
</script>

<div
	class="grid gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900/40 sm:grid-cols-3"
>
	<div class="flex items-center gap-2">
		<Usb class="h-3.5 w-3.5 shrink-0 text-[#00ADD8]" />
		<span
			>{$t('tools.rnode_flasher.transport_serial')}: {$t(
				`tools.rnode_flasher.${capabilityI18nKey(serialCap)}`
			)}</span
		>
	</div>
	<div class="flex items-center gap-2">
		<Bluetooth class="h-3.5 w-3.5 shrink-0 text-[#00ADD8]" />
		<span
			>{$t('tools.rnode_flasher.transport_bluetooth')}: {$t(
				`tools.rnode_flasher.${capabilityI18nKey(bluetoothCap)}`
			)}</span
		>
	</div>
	<div class="flex items-center gap-2">
		<Network class="h-3.5 w-3.5 shrink-0 text-[#00ADD8]" />
		<span
			>{$t('tools.rnode_flasher.transport_ip')}: {$t(
				`tools.rnode_flasher.${capabilityI18nKey(ipCap)}`
			)}</span
		>
	</div>
	<p class="flex items-start gap-2 text-zinc-500 sm:col-span-3">
		<AlertTriangle class="mt-0.5 h-3.5 w-3.5 shrink-0" />
		<span>
			{$t('tools.rnode_flasher.permission_hint')}
			{$t(`tools.rnode_flasher.${engineNoteKey}`)}
		</span>
	</p>
	{#if showBraveHelp}
		<div
			class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-amber-950 sm:col-span-3 dark:text-amber-100"
			role="status"
		>
			<p class="font-semibold">{$t('tools.rnode_flasher.brave_blocked_title')}</p>
			<p class="mt-1">{$t('tools.rnode_flasher.brave_blocked_blurb')}</p>
			{#if braveNeedsSerial}
				<p class="mt-2 font-medium">{$t('tools.rnode_flasher.brave_enable_serial_title')}</p>
				<ol class="mt-1 list-decimal space-y-1 pl-4">
					<li>{$t('tools.rnode_flasher.brave_enable_serial_step1')}</li>
					<li>{$t('tools.rnode_flasher.brave_enable_serial_step2')}</li>
					<li>{$t('tools.rnode_flasher.brave_enable_serial_step3')}</li>
				</ol>
			{/if}
			{#if braveNeedsBluetooth}
				<p class="mt-2 font-medium">{$t('tools.rnode_flasher.brave_enable_bluetooth_title')}</p>
				<ol class="mt-1 list-decimal space-y-1 pl-4">
					<li>{$t('tools.rnode_flasher.brave_enable_bluetooth_step1')}</li>
					<li>{$t('tools.rnode_flasher.brave_enable_bluetooth_step2')}</li>
					<li>{$t('tools.rnode_flasher.brave_enable_bluetooth_step3')}</li>
				</ol>
			{/if}
			<p class="mt-2">{$t('tools.rnode_flasher.brave_enable_reload')}</p>
		</div>
	{/if}
</div>
