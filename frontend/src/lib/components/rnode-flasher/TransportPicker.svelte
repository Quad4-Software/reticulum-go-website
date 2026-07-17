<script lang="ts">
	import { Bluetooth, FlaskConical, Network, Usb } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { t } from 'svelte-i18n';
	import {
		bluetoothCapability,
		ipCapability,
		serialCapability,
		type TransportKind
	} from '$lib/rnode-flasher';

	interface Props {
		disabled: boolean;
		connected: boolean;
		selected: TransportKind | null;
		ipHost: string;
		ipPort: number;
		onIpHost: (v: string) => void;
		onIpPort: (v: number) => void;
		onConnect: (kind: TransportKind) => void;
		onDisconnect: () => void;
	}

	let {
		disabled,
		connected,
		selected,
		ipHost,
		ipPort,
		onIpHost,
		onIpPort,
		onConnect,
		onDisconnect
	}: Props = $props();

	let serialOk = $derived(browser && serialCapability() === 'supported');
	let bluetoothOk = $derived(browser && bluetoothCapability() === 'supported');
	let ipOk = $derived(!browser || ipCapability() === 'supported');

	let options = $derived([
		{
			kind: 'serial' as const,
			icon: Usb,
			labelKey: 'tools.rnode_flasher.transport_serial',
			available: serialOk
		},
		{
			kind: 'bluetooth' as const,
			icon: Bluetooth,
			labelKey: 'tools.rnode_flasher.transport_bluetooth',
			available: bluetoothOk
		},
		{
			kind: 'ip' as const,
			icon: Network,
			labelKey: 'tools.rnode_flasher.transport_ip',
			available: ipOk
		},
		{
			kind: 'sim' as const,
			icon: FlaskConical,
			labelKey: 'tools.rnode_flasher.transport_sim',
			available: true
		}
	]);
</script>

<div class="space-y-3">
	<div class="grid gap-2 sm:grid-cols-2">
		{#each options as opt (opt.kind)}
			<button
				type="button"
				class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors {selected ===
				opt.kind
					? 'border-[#00ADD8] bg-[#00ADD8]/10'
					: 'border-zinc-200 dark:border-zinc-800'} disabled:opacity-50"
				disabled={disabled || !opt.available}
				onclick={() => onConnect(opt.kind)}
			>
				<opt.icon class="h-5 w-5 text-[#00ADD8]" />
				<span class="font-medium">{$t(opt.labelKey)}</span>
			</button>
		{/each}
	</div>

	<div class="flex flex-wrap items-end gap-2">
		<label class="text-sm">
			<span class="mb-1 block text-zinc-500">{$t('tools.rnode_flasher.ip_host')}</span>
			<input
				class="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-800"
				value={ipHost}
				oninput={(e) => onIpHost((e.currentTarget as HTMLInputElement).value)}
			/>
		</label>
		<label class="text-sm">
			<span class="mb-1 block text-zinc-500">{$t('tools.rnode_flasher.ip_port')}</span>
			<input
				type="number"
				class="w-28 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 dark:border-zinc-800"
				value={ipPort}
				oninput={(e) => onIpPort(Number((e.currentTarget as HTMLInputElement).value) || 4030)}
			/>
		</label>
		{#if connected}
			<button
				type="button"
				class="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
				onclick={onDisconnect}
			>
				{$t('tools.rnode_flasher.disconnect')}
			</button>
			<span class="text-sm text-emerald-600 dark:text-emerald-400"
				>{$t('tools.rnode_flasher.connected')}</span
			>
		{/if}
	</div>
</div>
