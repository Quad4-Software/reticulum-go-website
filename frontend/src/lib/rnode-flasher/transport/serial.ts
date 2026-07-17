/**
 * Web Serial transport for USB flashing.
 */

import type { DeviceTransport } from './types';
import type { ConnectOptions, TransportInfo } from '../types';
import { FlasherError, flasherErrorFromUnknown } from '../errors';
import { serialCapability } from './permissions';

type SerialPortLike = {
	open(options: { baudRate: number }): Promise<void>;
	close(): Promise<void>;
	readable: ReadableStream<Uint8Array> | null;
	writable: WritableStream<Uint8Array> | null;
	getInfo(): { usbVendorId?: number; usbProductId?: number };
};

export class WebSerialTransport implements DeviceTransport {
	readonly kind = 'serial' as const;
	private port: SerialPortLike | null = null;
	private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
	private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
	private baud = 115200;
	private label = 'Serial';

	async connect(opts: ConnectOptions = {}): Promise<void> {
		const cap = serialCapability();
		if (cap === 'unsupported') {
			throw new FlasherError(
				'SerialUnsupported',
				'Web Serial is not available',
				'',
				'Use Chrome Edge or Opera on desktop over HTTPS'
			);
		}
		if (cap === 'insecure_context') {
			throw new FlasherError(
				'SerialPermissionDenied',
				'Serial requires a secure context',
				'',
				'Open this site over HTTPS'
			);
		}
		const serial = (
			navigator as Navigator & { serial?: { requestPort: (o?: object) => Promise<SerialPortLike> } }
		).serial;
		if (!serial) {
			throw new FlasherError('SerialUnsupported', 'Web Serial is not available');
		}
		try {
			this.port = await serial.requestPort(
				opts.filters?.length ? { filters: opts.filters } : undefined
			);
			this.baud = opts.baud ?? 115200;
			await this.port.open({ baudRate: this.baud });
			if (!this.port.readable || !this.port.writable) {
				throw new FlasherError('PortBusy', 'Serial port streams are unavailable');
			}
			this.reader = this.port.readable.getReader();
			this.writer = this.port.writable.getWriter();
			const info = this.port.getInfo();
			this.label =
				info.usbVendorId !== undefined
					? `Serial 0x${info.usbVendorId.toString(16)}`
					: 'Serial port';
		} catch (err) {
			await this.disconnect();
			throw flasherErrorFromUnknown(err);
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.reader?.cancel();
		} catch {
			/* ignore */
		}
		try {
			this.writer?.releaseLock();
		} catch {
			/* ignore */
		}
		try {
			await this.port?.close();
		} catch {
			/* ignore */
		}
		this.reader = null;
		this.writer = null;
		this.port = null;
	}

	async write(data: Uint8Array): Promise<void> {
		if (!this.writer) throw new FlasherError('PortBusy', 'Serial port is not connected');
		await this.writer.write(data);
	}

	async read(max = 4096): Promise<Uint8Array> {
		if (!this.reader) throw new FlasherError('PortBusy', 'Serial port is not connected');
		const result = await this.reader.read();
		if (result.done || !result.value) {
			throw new FlasherError(
				'DisconnectDuringFlash',
				'Serial device disconnected',
				'',
				'Reconnect the board and retry'
			);
		}
		return result.value.length > max ? result.value.slice(0, max) : result.value;
	}

	async setBaud(baud: number): Promise<void> {
		if (!this.port) throw new FlasherError('PortBusy', 'Serial port is not connected');
		await this.disconnect();
		const serial = (
			navigator as Navigator & { serial?: { getPorts: () => Promise<SerialPortLike[]> } }
		).serial;
		const ports = (await serial?.getPorts()) ?? [];
		this.port = ports[0] ?? null;
		if (!this.port) {
			throw new FlasherError(
				'PortBusy',
				'Could not reopen serial port after baud change',
				'',
				'Reconnect the device'
			);
		}
		this.baud = baud;
		await this.port.open({ baudRate: baud });
		if (!this.port.readable || !this.port.writable) {
			throw new FlasherError('PortBusy', 'Serial port streams are unavailable');
		}
		this.reader = this.port.readable.getReader();
		this.writer = this.port.writable.getWriter();
	}

	getInfo(): TransportInfo {
		return {
			kind: 'serial',
			label: this.label,
			connected: this.port !== null,
			baud: this.baud
		};
	}
}
