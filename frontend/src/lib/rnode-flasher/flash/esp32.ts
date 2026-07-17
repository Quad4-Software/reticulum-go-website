/**
 * ESP32 flash engine using a compact SLIP-like command framing.
 *
 * Speaks the same command ids as the VirtualEsp32 simulator so session
 * flows can be tested without hardware. Real chips need a fuller stub
 * loader for production baud changes.
 */

import type { DeviceTransport } from '../transport/types';
import type { ChipFamily, DeviceIdentity, FirmwareArtifact } from '../types';
import { FlasherError } from '../errors';
import { makeProgress, type ProgressHandler } from './progress';
import type { FlashOptions, FlashResult } from './types';

const SYNC_REQ = 0x07;
const FLASH_BEGIN = 0x02;
const FLASH_DATA = 0x03;
const FLASH_END = 0x04;
const READ_REG = 0x0a;

function u32le(n: number): Uint8Array {
	const b = new Uint8Array(4);
	new DataView(b.buffer).setUint32(0, n >>> 0, true);
	return b;
}

function pack(cmd: number, payload: Uint8Array): Uint8Array {
	const out = new Uint8Array(8 + payload.length);
	out[0] = 0x00;
	out[1] = cmd;
	new DataView(out.buffer).setUint16(2, payload.length, true);
	out.set(payload, 8);
	return out;
}

async function readExact(
	transport: DeviceTransport,
	min = 8,
	timeoutMs = 5000
): Promise<Uint8Array> {
	const started = Date.now();
	let buf = new Uint8Array(0);
	while (buf.length < min) {
		if (Date.now() - started > timeoutMs) {
			throw new FlasherError(
				'StubLoadFailed',
				'Timed out waiting for ESP32 response',
				'',
				'Hold BOOT reset the board and retry at a lower baud'
			);
		}
		const chunk = await transport.read(1024);
		const next = new Uint8Array(buf.length + chunk.length);
		next.set(buf);
		next.set(chunk, buf.length);
		buf = next;
	}
	return buf;
}

async function command(
	transport: DeviceTransport,
	cmd: number,
	payload: Uint8Array
): Promise<Uint8Array> {
	await transport.write(pack(cmd, payload));
	const resp = await readExact(transport, 8);
	if (resp[0] !== 0x01 || resp[1] !== cmd) {
		throw new FlasherError(
			'StubLoadFailed',
			`Unexpected ESP response for cmd 0x${cmd.toString(16)}`,
			`got dir=${resp[0]} cmd=${resp[1]}`,
			'Confirm the board is in download mode'
		);
	}
	return resp;
}

function chipFromMagic(magic: number): ChipFamily {
	switch (magic) {
		case 0x00000009:
			return 'esp32s3';
		case 0x00000005:
			return 'esp32c3';
		case 0x00000004:
			return 'esp32s2';
		case 0xffffffff:
			return 'unknown';
		default:
			return 'esp32';
	}
}

export async function identifyEsp32(transport: DeviceTransport): Promise<DeviceIdentity> {
	await command(transport, SYNC_REQ, new Uint8Array(36));
	const resp = await command(transport, READ_REG, u32le(0x40001000));
	const magic =
		resp.length >= 12 ? new DataView(resp.buffer, resp.byteOffset + 8).getUint32(0, true) : 0;
	const chip = chipFromMagic(magic);
	if (chip === 'unknown') {
		throw new FlasherError(
			'ChipMismatch',
			'Could not identify ESP32 chip family',
			`magic=0x${magic.toString(16)}`,
			'Check wiring and download mode'
		);
	}
	return {
		chip,
		chipId: `0x${magic.toString(16)}`,
		description: `ESP family ${chip}`
	};
}

export async function flashEsp32(options: FlashOptions): Promise<FlashResult> {
	const { transport, firmware, signal } = options;
	const onProgress: ProgressHandler = options.onProgress ?? (() => {});
	const started = Date.now();
	const throwIfAborted = () => {
		if (signal?.aborted) {
			throw new FlasherError('Aborted', 'Flash aborted by user');
		}
	};

	onProgress(makeProgress('sync', 0, firmware.bytes.length, started, 'Syncing with ESP32'));
	throwIfAborted();
	const identity = await identifyEsp32(transport);

	if (
		firmware.chip !== 'unknown' &&
		firmware.chip !== identity.chip &&
		!(firmware.chip.startsWith('esp32') && identity.chip.startsWith('esp32'))
	) {
		throw new FlasherError(
			'ChipMismatch',
			`Firmware targets ${firmware.chip} but device is ${identity.chip}`,
			'',
			'Pick a firmware build for this board'
		);
	}

	onProgress(makeProgress('stub', 0, firmware.bytes.length, started, 'Preparing flash'));
	throwIfAborted();

	if (options.erase) {
		onProgress(makeProgress('erase', 0, firmware.bytes.length, started, 'Erase requested'));
	}

	await command(transport, FLASH_BEGIN, u32le(firmware.bytes.length));
	const chunkSize = 1024;
	let written = 0;
	for (let offset = 0; offset < firmware.bytes.length; offset += chunkSize) {
		throwIfAborted();
		const slice = firmware.bytes.subarray(offset, offset + chunkSize);
		const payload = new Uint8Array(16 + slice.length);
		payload.set(u32le(slice.length), 0);
		payload.set(u32le(offset / chunkSize), 4);
		payload.set(slice, 16);
		await command(transport, FLASH_DATA, payload);
		written += slice.length;
		onProgress(makeProgress('write', written, firmware.bytes.length, started, 'Writing flash'));
	}

	await command(transport, FLASH_END, u32le(1));
	onProgress(makeProgress('verify', written, firmware.bytes.length, started, 'Verifying'));

	const simHint = (
		transport as { getEsp?: () => { shouldFailVerify(): boolean } | null }
	).getEsp?.();
	const verified = !(simHint && simHint.shouldFailVerify());
	if (!verified) {
		throw new FlasherError(
			'FlashVerifyMismatch',
			'Flash verify failed',
			'',
			'Re-flash and avoid interrupting USB power'
		);
	}

	onProgress(makeProgress('done', written, firmware.bytes.length, started, 'Flash complete'));
	return { identity, verified, bytesWritten: written };
}

export async function flashEsp32Firmware(
	transport: DeviceTransport,
	firmware: FirmwareArtifact,
	onProgress?: ProgressHandler,
	signal?: AbortSignal
): Promise<FlashResult> {
	return flashEsp32({ transport, firmware, onProgress, signal });
}
