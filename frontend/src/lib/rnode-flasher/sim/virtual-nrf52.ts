/**
 * Minimal nRF52 serial DFU simulator for tests and demos.
 */

import { SimPort } from '../transport/sim-port';
import {
	RNODE_CMD_HASH,
	RNODE_CMD_PROVISION,
	RNODE_CMD_STATUS,
	RNODE_FRAME_START,
	RNODE_RESP_OK
} from '../rnode/framing';
import { parseSimFault, type SimFaultId } from './faults';

const DFU_START = 0x01;
const DFU_DATA = 0x02;
const DFU_END = 0x03;
const DFU_OK = 0x60;
const DFU_ERR = 0x61;

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

export class VirtualNrf52 {
	readonly port = new SimPort();
	private fault: SimFaultId;
	private buf = new Uint8Array(0);
	private received = 0;
	private provisioned = false;

	constructor(fault: string | SimFaultId = 'none') {
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
		while (this.buf.length >= 2) {
			if (this.buf[0] === RNODE_FRAME_START) {
				if (this.buf.length < 4) return;
				const len = this.buf[2];
				if (this.buf.length < 4 + len) return;
				const cmd = this.buf[1];
				const payload = this.buf.slice(3, 3 + len);
				this.buf = this.buf.slice(4 + len);
				this.handleRnode(cmd, payload);
				continue;
			}
			const cmd = this.buf[0];
			const size = this.buf[1];
			if (this.buf.length < 2 + size) return;
			const payload = this.buf.slice(2, 2 + size);
			this.buf = this.buf.slice(2 + size);
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
		if (this.fault === 'dfu_reject') {
			this.port.pushFromDevice(new Uint8Array([DFU_ERR, 0]));
			return;
		}
		if (this.fault === 'timeout' && cmd === DFU_DATA) return;
		if (this.fault === 'disconnect_mid_write' && cmd === DFU_DATA && this.received > 0) {
			this.port.close();
			return;
		}
		switch (cmd) {
			case DFU_START:
				this.received = 0;
				this.port.pushFromDevice(new Uint8Array([DFU_OK, 0]));
				break;
			case DFU_DATA:
				this.received += payload.length;
				this.port.pushFromDevice(new Uint8Array([DFU_OK, 0]));
				break;
			case DFU_END:
				this.port.pushFromDevice(new Uint8Array([DFU_OK, 0]));
				break;
			default:
				this.port.pushFromDevice(new Uint8Array([DFU_ERR, 0]));
		}
	}

	bytesReceived(): number {
		return this.received;
	}
}
