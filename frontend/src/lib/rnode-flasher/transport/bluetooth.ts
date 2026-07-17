/**
 * Web Bluetooth transport for config monitor and DFU where supported.
 */

import type { DeviceTransport } from './types';
import type { ConnectOptions, TransportInfo } from '../types';
import { FlasherError, flasherErrorFromUnknown } from '../errors';
import { bluetoothCapability } from './permissions';

/** Nordic UART-style service used by many RNode-class BLE boards. */
export const RNODE_BLE_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const RNODE_BLE_RX = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const RNODE_BLE_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

type BleChar = {
	writeValue(data: BufferSource): Promise<void>;
	startNotifications(): Promise<BleChar>;
	addEventListener(type: string, listener: (ev: Event) => void): void;
	removeEventListener(type: string, listener: (ev: Event) => void): void;
};

type BleGatt = {
	connected: boolean;
	connect(): Promise<BleServer>;
	disconnect?: () => void;
};

type BleServer = {
	getPrimaryService(uuid: string): Promise<{
		getCharacteristic(uuid: string): Promise<BleChar>;
	}>;
};

type BleDevice = {
	name?: string;
	gatt?: BleGatt;
	addEventListener(type: string, listener: () => void): void;
};

export class WebBluetoothTransport implements DeviceTransport {
	readonly kind = 'bluetooth' as const;
	private device: BleDevice | null = null;
	private rx: BleChar | null = null;
	private tx: BleChar | null = null;
	private queue: Uint8Array[] = [];
	private waiters: Array<(chunk: Uint8Array) => void> = [];
	private label = 'Bluetooth';
	private onNotify = (ev: Event) => {
		const target = ev.target as { value?: DataView } | null;
		const value = target?.value;
		if (!value) return;
		const chunk = new Uint8Array(
			value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
		);
		const waiter = this.waiters.shift();
		if (waiter) waiter(chunk);
		else this.queue.push(chunk);
	};

	async connect(_opts: ConnectOptions = {}): Promise<void> {
		const cap = bluetoothCapability();
		if (cap === 'unsupported') {
			throw new FlasherError(
				'BluetoothUnsupported',
				'Web Bluetooth is not available',
				'',
				'Use a Chromium browser with Bluetooth enabled over HTTPS'
			);
		}
		if (cap === 'insecure_context') {
			throw new FlasherError(
				'BluetoothPermissionDenied',
				'Bluetooth requires a secure context',
				'',
				'Open this site over HTTPS'
			);
		}
		const bluetooth = (
			navigator as Navigator & {
				bluetooth?: {
					requestDevice(options: object): Promise<BleDevice>;
				};
			}
		).bluetooth;
		if (!bluetooth) {
			throw new FlasherError('BluetoothUnsupported', 'Web Bluetooth is not available');
		}
		try {
			const device = await bluetooth.requestDevice({
				filters: [{ services: [RNODE_BLE_UART_SERVICE] }],
				optionalServices: [RNODE_BLE_UART_SERVICE]
			});
			this.device = device;
			this.label = device.name || 'Bluetooth device';
			const gatt = device.gatt;
			if (!gatt) {
				throw new FlasherError(
					'BluetoothPermissionDenied',
					'Bluetooth GATT is unavailable',
					'',
					'Reconnect the device and retry'
				);
			}
			const server = await gatt.connect();
			const service = await server.getPrimaryService(RNODE_BLE_UART_SERVICE);
			this.rx = await service.getCharacteristic(RNODE_BLE_RX);
			this.tx = await service.getCharacteristic(RNODE_BLE_TX);
			await this.tx.startNotifications();
			this.tx.addEventListener('characteristicvaluechanged', this.onNotify);
			device.addEventListener('gattserverdisconnected', () => {
				this.rx = null;
				this.tx = null;
			});
		} catch (err) {
			await this.disconnect();
			throw flasherErrorFromUnknown(err);
		}
	}

	async disconnect(): Promise<void> {
		try {
			this.tx?.removeEventListener('characteristicvaluechanged', this.onNotify);
		} catch {
			/* ignore */
		}
		try {
			const gatt = this.device?.gatt;
			if (gatt && typeof gatt.disconnect === 'function') {
				gatt.disconnect();
			}
		} catch {
			/* ignore */
		}
		this.device = null;
		this.rx = null;
		this.tx = null;
		this.queue = [];
		this.waiters = [];
	}

	async write(data: Uint8Array): Promise<void> {
		if (!this.rx) {
			throw new FlasherError(
				'BluetoothPermissionDenied',
				'Bluetooth device is not connected',
				'',
				'Reconnect over Bluetooth or use USB Serial for flashing'
			);
		}
		const chunkSize = 20;
		for (let i = 0; i < data.length; i += chunkSize) {
			const slice = new Uint8Array(data.subarray(i, i + chunkSize));
			await this.rx.writeValue(slice);
		}
	}

	async read(max = 4096): Promise<Uint8Array> {
		if (this.queue.length > 0) {
			const chunk = this.queue.shift()!;
			return chunk.length > max ? chunk.slice(0, max) : chunk;
		}
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(
					new FlasherError(
						'DisconnectDuringFlash',
						'Bluetooth read timed out',
						'',
						'Keep the device nearby and retry'
					)
				);
			}, 10000);
			this.waiters.push((chunk) => {
				clearTimeout(timer);
				resolve(chunk.length > max ? chunk.slice(0, max) : chunk);
			});
		});
	}

	getInfo(): TransportInfo {
		return {
			kind: 'bluetooth',
			label: this.label,
			connected: this.device?.gatt?.connected === true,
			deviceName: this.device?.name
		};
	}
}
