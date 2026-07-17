/**
 * IP transport for a local framed flash bridge.
 *
 * Framing: [u32 le length][payload]
 */

import type { DeviceTransport } from './types';
import type { ConnectOptions, TransportInfo } from '../types';
import { FlasherError } from '../errors';

export class IpTransport implements DeviceTransport {
	readonly kind = 'ip' as const;
	private ws: WebSocket | null = null;
	private queue: Uint8Array[] = [];
	private waiters: Array<(chunk: Uint8Array) => void> = [];
	private label = 'IP';
	private buffer = new Uint8Array(0);

	async connect(opts: ConnectOptions = {}): Promise<void> {
		const host = opts.host?.trim() || '127.0.0.1';
		const port = opts.port ?? 4030;
		const url = `ws://${host}:${port}`;
		this.label = `IP ${host}:${port}`;
		await new Promise<void>((resolve, reject) => {
			let settled = false;
			const ws = new WebSocket(url);
			ws.binaryType = 'arraybuffer';
			const timer = setTimeout(() => {
				if (settled) return;
				settled = true;
				ws.close();
				reject(
					new FlasherError(
						'IpConnectFailed',
						`Could not connect to ${url}`,
						'',
						'Start your local flash bridge and check host port'
					)
				);
			}, 8000);
			ws.onopen = () => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				this.ws = ws;
				resolve();
			};
			ws.onerror = () => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				reject(
					new FlasherError(
						'IpConnectFailed',
						`WebSocket error connecting to ${url}`,
						'',
						'Confirm the bridge allows browser connections'
					)
				);
			};
			ws.onmessage = (ev) => {
				const data = new Uint8Array(ev.data as ArrayBuffer);
				this.ingest(data);
			};
			ws.onclose = () => {
				this.ws = null;
			};
		});
	}

	private ingest(chunk: Uint8Array) {
		const merged = new Uint8Array(this.buffer.length + chunk.length);
		merged.set(this.buffer);
		merged.set(chunk, this.buffer.length);
		this.buffer = merged;
		while (this.buffer.length >= 4) {
			const len = new DataView(this.buffer.buffer, this.buffer.byteOffset).getUint32(0, true);
			if (this.buffer.length < 4 + len) return;
			const payload = this.buffer.slice(4, 4 + len);
			this.buffer = this.buffer.slice(4 + len);
			const waiter = this.waiters.shift();
			if (waiter) waiter(payload);
			else this.queue.push(payload);
		}
	}

	async disconnect(): Promise<void> {
		this.ws?.close();
		this.ws = null;
		this.queue = [];
		this.waiters = [];
		this.buffer = new Uint8Array(0);
	}

	async write(data: Uint8Array): Promise<void> {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			throw new FlasherError('IpConnectFailed', 'IP bridge is not connected');
		}
		const frame = new Uint8Array(4 + data.length);
		new DataView(frame.buffer).setUint32(0, data.length, true);
		frame.set(data, 4);
		this.ws.send(frame);
	}

	async read(max = 4096): Promise<Uint8Array> {
		if (this.queue.length > 0) {
			const chunk = this.queue.shift()!;
			return chunk.length > max ? chunk.slice(0, max) : chunk;
		}
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(new FlasherError('IpConnectFailed', 'IP read timed out'));
			}, 10000);
			this.waiters.push((chunk) => {
				clearTimeout(timer);
				resolve(chunk.length > max ? chunk.slice(0, max) : chunk);
			});
		});
	}

	getInfo(): TransportInfo {
		return {
			kind: 'ip',
			label: this.label,
			connected: this.ws?.readyState === WebSocket.OPEN
		};
	}
}
