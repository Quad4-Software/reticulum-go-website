/**
 * Flasher session state machine.
 */

import type { DeviceTransport } from './transport/types';
import type {
	DeviceIdentity,
	FirmwareArtifact,
	FlashProgress,
	LogLine,
	ProvisionResult,
	SessionPhase,
	TransportKind
} from './types';
import { FlasherError, flasherErrorFromUnknown } from './errors';
import { flashEsp32 } from './flash/esp32';
import { flashNrf52 } from './flash/nrf52-dfu';
import { provisionDevice } from './rnode/provision';
import { cacheFirmware, setLastFlashMeta } from './firmware/cache';
import { SimTransport } from './transport/sim';
import { WebSerialTransport } from './transport/serial';
import { WebBluetoothTransport } from './transport/bluetooth';
import { IpTransport } from './transport/ip';
import type { ConnectOptions } from './types';

export type SessionListener = (snapshot: SessionSnapshot) => void;

export interface SessionSnapshot {
	phase: SessionPhase;
	firmware: FirmwareArtifact | null;
	transportKind: TransportKind | null;
	identity: DeviceIdentity | null;
	progress: FlashProgress | null;
	provision: ProvisionResult | null;
	error: FlasherError | null;
	logs: LogLine[];
	connected: boolean;
}

function emptyProgress(): FlashProgress {
	return {
		phase: 'idle',
		bytesWritten: 0,
		bytesTotal: 0,
		rateBytesPerSec: 0,
		message: ''
	};
}

export class FlasherSession {
	private phase: SessionPhase = 'idle';
	private firmware: FirmwareArtifact | null = null;
	private transport: DeviceTransport | null = null;
	private transportKind: TransportKind | null = null;
	private identity: DeviceIdentity | null = null;
	private progress: FlashProgress | null = null;
	private provision: ProvisionResult | null = null;
	private error: FlasherError | null = null;
	private logs: LogLine[] = [];
	private listeners = new Set<SessionListener>();
	private abort: AbortController | null = null;

	subscribe(listener: SessionListener): () => void {
		this.listeners.add(listener);
		listener(this.snapshot());
		return () => this.listeners.delete(listener);
	}

	snapshot(): SessionSnapshot {
		return {
			phase: this.phase,
			firmware: this.firmware,
			transportKind: this.transportKind,
			identity: this.identity,
			progress: this.progress,
			provision: this.provision,
			error: this.error,
			logs: [...this.logs],
			connected: this.transport?.getInfo().connected ?? false
		};
	}

	private emit() {
		const snap = this.snapshot();
		for (const l of this.listeners) l(snap);
	}

	private log(level: LogLine['level'], message: string) {
		this.logs = [...this.logs.slice(-199), { ts: Date.now(), level, message }];
	}

	private setPhase(phase: SessionPhase) {
		this.phase = phase;
		this.emit();
	}

	selectFirmware(firmware: FirmwareArtifact) {
		this.firmware = firmware;
		this.error = null;
		this.phase = 'selectTransport';
		this.log('info', `Selected firmware ${firmware.name}`);
		this.emit();
	}

	clearFirmware() {
		this.firmware = null;
		this.phase = 'selectFirmware';
		this.emit();
	}

	createTransport(kind: TransportKind): DeviceTransport {
		switch (kind) {
			case 'serial':
				return new WebSerialTransport();
			case 'bluetooth':
				return new WebBluetoothTransport();
			case 'ip':
				return new IpTransport();
			case 'sim':
				return new SimTransport();
			default:
				throw new FlasherError('Unknown', `Unknown transport ${kind}`);
		}
	}

	async connect(kind: TransportKind, opts: ConnectOptions = {}): Promise<void> {
		if (!this.firmware) {
			throw new FlasherError('ArtifactParseFailed', 'Select firmware before connecting');
		}
		this.error = null;
		this.transportKind = kind;
		this.setPhase('connect');
		await this.disconnect();
		const transport = this.createTransport(kind);
		if (kind === 'sim' && !opts.simChip) {
			opts = {
				...opts,
				simChip: this.firmware.chip === 'nrf52' ? 'nrf52' : this.firmware.chip
			};
		}
		try {
			await transport.connect(opts);
			this.transport = transport;
			this.log('info', `Connected via ${kind}`);
			this.setPhase('identify');
			await this.identify();
		} catch (err) {
			this.error = flasherErrorFromUnknown(err);
			this.log('error', this.error.message);
			this.setPhase('error');
			throw this.error;
		}
	}

	async identify(): Promise<DeviceIdentity> {
		if (!this.transport || !this.firmware) {
			throw new FlasherError('PortBusy', 'Not connected');
		}
		this.setPhase('identify');
		if (this.firmware.chip === 'nrf52') {
			this.identity = { chip: 'nrf52', description: 'nRF52 target' };
		} else {
			const { identifyEsp32 } = await import('./flash/esp32');
			this.identity = await identifyEsp32(this.transport);
		}
		this.log('info', `Identified ${this.identity.description}`);
		this.emit();
		return this.identity;
	}

	async flash(): Promise<void> {
		if (!this.transport || !this.firmware) {
			throw new FlasherError('PortBusy', 'Select firmware and connect first');
		}
		this.error = null;
		this.abort = new AbortController();
		this.progress = emptyProgress();
		this.setPhase('flash');
		try {
			const onProgress = (p: FlashProgress) => {
				this.progress = p;
				this.emit();
			};
			const result =
				this.firmware.chip === 'nrf52'
					? await flashNrf52({
							transport: this.transport,
							firmware: this.firmware,
							onProgress,
							signal: this.abort.signal
						})
					: await flashEsp32({
							transport: this.transport,
							firmware: this.firmware,
							onProgress,
							signal: this.abort.signal
						});
			this.identity = result.identity;
			this.log('info', `Flashed ${result.bytesWritten} bytes`);
			this.setPhase('verify');
			await cacheFirmware(this.firmware);
			this.setPhase('provision');
			this.emit();
		} catch (err) {
			this.error = flasherErrorFromUnknown(err);
			this.log('error', this.error.message);
			this.setPhase('error');
			throw this.error;
		}
	}

	async runProvision(): Promise<ProvisionResult> {
		if (!this.transport || !this.firmware) {
			throw new FlasherError('PortBusy', 'Nothing to provision');
		}
		this.setPhase('provision');
		try {
			this.provision = await provisionDevice(this.transport, this.firmware);
			this.log('info', this.provision.message);
			await setLastFlashMeta({
				firmwareId: this.firmware.id,
				boardId: this.firmware.boardId,
				at: new Date().toISOString()
			});
			this.setPhase('done');
			return this.provision;
		} catch (err) {
			this.error = flasherErrorFromUnknown(err);
			this.log('error', this.error.message);
			this.setPhase('error');
			throw this.error;
		}
	}

	skipProvision() {
		this.provision = { provisioned: false, message: 'Provision skipped' };
		this.setPhase('done');
		this.log('info', 'Provision skipped');
		this.emit();
	}

	abortFlash() {
		this.abort?.abort();
		this.error = new FlasherError('Aborted', 'Flash aborted by user');
		this.setPhase('aborted');
		this.log('warn', 'Flash aborted');
		this.emit();
	}

	async disconnect(): Promise<void> {
		await this.transport?.disconnect();
		this.transport = null;
		this.emit();
	}

	reset() {
		void this.disconnect();
		this.phase = 'idle';
		this.firmware = null;
		this.transportKind = null;
		this.identity = null;
		this.progress = null;
		this.provision = null;
		this.error = null;
		this.logs = [];
		this.emit();
	}
}
