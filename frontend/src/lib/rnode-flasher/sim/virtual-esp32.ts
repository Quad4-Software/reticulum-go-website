/**
 * Minimal ESP32 flash protocol simulator for tests and demos.
 */

import { SimPort } from '../transport/sim-port';
import type { ChipFamily } from '../types';
import {
	RNODE_CMD_HASH,
	RNODE_CMD_PROVISION,
	RNODE_CMD_STATUS,
	RNODE_FRAME_START,
	RNODE_RESP_OK
} from '../rnode/framing';
import { parseSimFault, type SimFaultId } from './faults';

const SYNC_REQ = 0x07;
const FLASH_BEGIN = 0x02;
const FLASH_DATA = 0x03;
const FLASH_END = 0x04;
const MEM_END = 0x05;
const READ_REG = 0x0a;

function u32(n: number): Uint8Array {
	const b = new Uint8Array(4);
	new DataView(b.buffer).setUint32(0, n >>> 0, true);
	return b;
}

function ok(cmd: number, payload: Uint8Array = new Uint8Array(4)): Uint8Array {
	const out = new Uint8Array(8 + payload.length);
	out[0] = 0x01;
	out[1] = cmd;
	new DataView(out.buffer).setUint16(2, payload.length, true);
	out.set(payload, 8);
	return out;
}

function rnodeOk(payload: Uint8Array = new Uint8Array([0x01])): Uint8Array {
	const out = new Uint8Array(4 + payload.length);
	out[0] = RNODE_FRAME_START;
	out[1] = RNODE_RESP_OK;
	out[2] = payload.length & 0xff;
	out.set(payload, 3);
	let csum = RNODE_RESP_OK ^ (payload.length & 0xff);
	for (const b of payload) csum ^= b;
	out[out.length - 1] = csum & 0xff;
	return out;
}

export class VirtualEsp32 {
	readonly port = new SimPort();
	private fault: SimFaultId;
	private chip: ChipFamily;
	private flash = new Uint8Array(1024 * 1024);
	private writing = false;
	private written = 0;
	private expected = 0;
	private buf = new Uint8Array(0);
	private provisioned = false;

	constructor(chip: ChipFamily = 'esp32', fault: string | SimFaultId = 'none') {
		this.chip = chip;
		this.fault = typeof fault === 'string' ? parseSimFault(fault) : fault;
		this.port.attachPeer((data) => this.onHostWrite(data));
	}

	private onHostWrite(data: Uint8Array) {
		const merged = new Uint8Array(this.buf.length + data.length);
		merged.set(this.buf);
		merged.set(data, this.buf.length);
		this.buf = merged;
		this.drain();
	}

	private drain() {
		while (this.buf.length >= 4) {
			if (this.buf[0] === RNODE_FRAME_START) {
				const len = this.buf[2];
				if (this.buf.length < 4 + len) return;
				const cmd = this.buf[1];
				const payload = this.buf.slice(3, 3 + len);
				this.buf = this.buf.slice(4 + len);
				this.handleRnode(cmd, payload);
				continue;
			}
			if (this.buf.length < 8) return;
			const dir = this.buf[0];
			const cmd = this.buf[1];
			const size = new DataView(
				this.buf.buffer,
				this.buf.byteOffset,
				this.buf.byteLength
			).getUint16(2, true);
			if (dir !== 0x00) {
				this.buf = this.buf.slice(1);
				continue;
			}
			if (this.buf.length < 8 + size) return;
			const payload = this.buf.slice(8, 8 + size);
			this.buf = this.buf.slice(8 + size);
			this.handle(cmd, payload);
		}
	}

	private handleRnode(cmd: number, _payload: Uint8Array) {
		switch (cmd) {
			case RNODE_CMD_STATUS:
				this.port.pushFromDevice(rnodeOk(new Uint8Array([this.provisioned ? 0x01 : 0x00])));
				break;
			case RNODE_CMD_PROVISION:
				this.provisioned = true;
				this.port.pushFromDevice(rnodeOk(new Uint8Array([0x01])));
				break;
			case RNODE_CMD_HASH:
				this.port.pushFromDevice(rnodeOk(new Uint8Array([0x01])));
				break;
			default:
				this.port.pushFromDevice(rnodeOk());
		}
	}

	private handle(cmd: number, payload: Uint8Array) {
		if (this.fault === 'timeout' && cmd === FLASH_DATA) {
			return;
		}
		if (this.fault === 'wrong_chip' && cmd === READ_REG) {
			this.port.pushFromDevice(ok(READ_REG, u32(0xffffffff)));
			return;
		}
		if (this.fault === 'disconnect_mid_write' && cmd === FLASH_DATA && this.written > 0) {
			this.port.close();
			return;
		}
		switch (cmd) {
			case SYNC_REQ:
				this.port.pushFromDevice(ok(SYNC_REQ));
				break;
			case MEM_END:
				this.port.pushFromDevice(ok(MEM_END));
				break;
			case FLASH_BEGIN: {
				this.expected =
					payload.length >= 4
						? new DataView(payload.buffer, payload.byteOffset).getUint32(0, true)
						: 0;
				this.written = 0;
				this.writing = true;
				this.port.pushFromDevice(ok(FLASH_BEGIN));
				break;
			}
			case FLASH_DATA: {
				if (this.writing) {
					const data = payload.length > 16 ? payload.slice(16) : payload;
					const offset = this.written;
					this.flash.set(
						data.subarray(0, Math.min(data.length, this.flash.length - offset)),
						offset
					);
					this.written += data.length;
				}
				this.port.pushFromDevice(ok(FLASH_DATA));
				break;
			}
			case FLASH_END:
				this.writing = false;
				this.port.pushFromDevice(ok(FLASH_END));
				break;
			case READ_REG:
				this.port.pushFromDevice(ok(READ_REG, u32(this.chipMagic())));
				break;
			default:
				this.port.pushFromDevice(ok(cmd));
		}
	}

	private chipMagic(): number {
		switch (this.chip) {
			case 'esp32s3':
				return 0x00000009;
			case 'esp32c3':
				return 0x00000005;
			case 'esp32s2':
				return 0x00000004;
			default:
				return 0x00000000;
		}
	}

	getWrittenBytes(): Uint8Array {
		return this.flash.slice(0, this.written || this.expected || 0);
	}

	shouldFailVerify(): boolean {
		return this.fault === 'bad_verify';
	}
}
