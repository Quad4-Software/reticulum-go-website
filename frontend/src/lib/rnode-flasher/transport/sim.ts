/**
 * Simulator-backed device transport for demos and automated tests.
 */

import type { DeviceTransport } from './types';
import type { ConnectOptions, TransportInfo } from '../types';
import { FlasherError } from '../errors';
import { VirtualEsp32 } from '../sim/virtual-esp32';
import { VirtualNrf52 } from '../sim/virtual-nrf52';
import type { SimPort } from './sim-port';

export class SimTransport implements DeviceTransport {
	readonly kind = 'sim' as const;
	private port: SimPort | null = null;
	private label = 'Simulator';
	private esp: VirtualEsp32 | null = null;
	private nrf: VirtualNrf52 | null = null;

	async connect(opts: ConnectOptions = {}): Promise<void> {
		const chip = opts.simChip ?? 'esp32';
		const fault = opts.simFault ?? 'none';
		if (chip === 'nrf52') {
			this.nrf = new VirtualNrf52(fault);
			this.port = this.nrf.port;
			this.label = 'Sim nRF52';
		} else {
			this.esp = new VirtualEsp32(chip, fault);
			this.port = this.esp.port;
			this.label = `Sim ${chip}`;
		}
	}

	async disconnect(): Promise<void> {
		this.port?.close();
		this.port = null;
		this.esp = null;
		this.nrf = null;
	}

	async write(data: Uint8Array): Promise<void> {
		if (!this.port) throw new FlasherError('PortBusy', 'Simulator is not connected');
		await this.port.write(data);
	}

	async read(max = 4096): Promise<Uint8Array> {
		if (!this.port) throw new FlasherError('PortBusy', 'Simulator is not connected');
		return this.port.read(max);
	}

	getInfo(): TransportInfo {
		return {
			kind: 'sim',
			label: this.label,
			connected: this.port !== null
		};
	}

	getEsp(): VirtualEsp32 | null {
		return this.esp;
	}

	getNrf(): VirtualNrf52 | null {
		return this.nrf;
	}
}
