/**
 * nRF52 serial DFU engine (Adafruit-style framing).
 */

import type { DeviceTransport } from '../transport/types';
import type { DeviceIdentity } from '../types';
import { FlasherError } from '../errors';
import { makeProgress, type ProgressHandler } from './progress';
import type { FlashOptions, FlashResult } from './types';

const DFU_START = 0x01;
const DFU_DATA = 0x02;
const DFU_END = 0x03;
const DFU_OK = 0x60;

function frame(cmd: number, payload: Uint8Array): Uint8Array {
	const out = new Uint8Array(2 + payload.length);
	out[0] = cmd;
	out[1] = payload.length & 0xff;
	out.set(payload, 2);
	return out;
}

async function expectOk(transport: DeviceTransport): Promise<void> {
	const resp = await transport.read(16);
	if (resp[0] !== DFU_OK) {
		throw new FlasherError(
			'DfuEnterFailed',
			'nRF52 DFU rejected the command',
			`code=${resp[0]}`,
			'Enter DFU mode then retry'
		);
	}
}

export async function identifyNrf52(_transport: DeviceTransport): Promise<DeviceIdentity> {
	return {
		chip: 'nrf52',
		description: 'nRF52 DFU target'
	};
}

export async function flashNrf52(options: FlashOptions): Promise<FlashResult> {
	const { transport, firmware, signal } = options;
	const onProgress: ProgressHandler = options.onProgress ?? (() => {});
	const started = Date.now();
	const throwIfAborted = () => {
		if (signal?.aborted) throw new FlasherError('Aborted', 'Flash aborted by user');
	};

	if (firmware.chip !== 'nrf52' && firmware.chip !== 'unknown') {
		throw new FlasherError(
			'BoardMismatch',
			`Firmware chip ${firmware.chip} is not nRF52`,
			'',
			'Select an nRF52 board build or use ESP32 flash'
		);
	}

	onProgress(makeProgress('dfu', 0, firmware.bytes.length, started, 'Starting DFU'));
	throwIfAborted();
	const identity = await identifyNrf52(transport);

	await transport.write(frame(DFU_START, new Uint8Array([0x00])));
	await expectOk(transport);

	const chunkSize = 64;
	let written = 0;
	for (let offset = 0; offset < firmware.bytes.length; offset += chunkSize) {
		throwIfAborted();
		const slice = firmware.bytes.subarray(offset, offset + chunkSize);
		await transport.write(frame(DFU_DATA, slice));
		await expectOk(transport);
		written += slice.length;
		onProgress(makeProgress('write', written, firmware.bytes.length, started, 'DFU write'));
	}

	await transport.write(frame(DFU_END, new Uint8Array(0)));
	await expectOk(transport);
	onProgress(makeProgress('verify', written, firmware.bytes.length, started, 'DFU complete'));
	onProgress(makeProgress('done', written, firmware.bytes.length, started, 'Flash complete'));

	return { identity, verified: true, bytesWritten: written };
}
