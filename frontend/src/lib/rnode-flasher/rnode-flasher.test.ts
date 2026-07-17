import { describe, it, expect } from 'vitest';
import { FlasherError, flasherErrorFromUnknown } from './errors';
import { FlasherSession } from './session';
import { flashEsp32 } from './flash/esp32';
import { flashNrf52 } from './flash/nrf52-dfu';
import { SimTransport } from './transport/sim';
import { provisionDevice } from './rnode/provision';
import { frameCommand, parseResponse, RNODE_CMD_STATUS } from './rnode/framing';
import { parseSimFault } from './sim/faults';
import { FIRMWARE_SOURCES } from './firmware/sources';
import { filterCatalog } from './firmware/catalog';
import type { FirmwareArtifact, FirmwareCatalog } from './types';

function demoFirmware(chip: FirmwareArtifact['chip'] = 'esp32'): FirmwareArtifact {
	const bytes = new Uint8Array(512);
	bytes.set(new TextEncoder().encode('RNODEDEMO'));
	return {
		id: `demo-${chip}`,
		name: `demo-${chip}.bin`,
		source: 'upload',
		version: 'test',
		boardId: chip === 'nrf52' ? 'rak4631' : 'generic-esp32',
		boardLabel: chip === 'nrf52' ? 'RAK4631' : 'Generic ESP32',
		chip,
		sha256: 'a'.repeat(64),
		bytes,
		available: true
	};
}

describe('flasher errors', () => {
	it('preserves FlasherError instances', () => {
		const err = new FlasherError('ChipMismatch', 'bad chip', 'detail', 'fix');
		expect(flasherErrorFromUnknown(err).code).toBe('ChipMismatch');
	});

	it('maps NotFoundError to permission denied style guidance', () => {
		const err = flasherErrorFromUnknown(new DOMException('gone', 'NotFoundError'));
		expect(err.code).toBe('SerialPermissionDenied');
		expect(err.suggestion.length).toBeGreaterThan(0);
	});
});

describe('sim flash engines', () => {
	it('flashes and provisions an ESP32 simulator', async () => {
		const transport = new SimTransport();
		const firmware = demoFirmware('esp32');
		await transport.connect({ simChip: 'esp32' });
		const result = await flashEsp32({ transport, firmware });
		expect(result.verified).toBe(true);
		expect(result.bytesWritten).toBe(firmware.bytes.length);
		const provision = await provisionDevice(transport, firmware);
		expect(provision.provisioned).toBe(true);
		await transport.disconnect();
	});

	it('flashes an nRF52 simulator via DFU', async () => {
		const transport = new SimTransport();
		const firmware = demoFirmware('nrf52');
		await transport.connect({ simChip: 'nrf52' });
		const result = await flashNrf52({ transport, firmware });
		expect(result.verified).toBe(true);
		expect(result.bytesWritten).toBe(firmware.bytes.length);
		await transport.disconnect();
	});

	it('rejects verify when bad_verify fault is set', async () => {
		const transport = new SimTransport();
		const firmware = demoFirmware('esp32');
		await transport.connect({ simChip: 'esp32', simFault: 'bad_verify' });
		await expect(flashEsp32({ transport, firmware })).rejects.toMatchObject({
			code: 'FlashVerifyMismatch'
		});
		await transport.disconnect();
	});

	it('rejects DFU when dfu_reject fault is set', async () => {
		const transport = new SimTransport();
		const firmware = demoFirmware('nrf52');
		await transport.connect({ simChip: 'nrf52', simFault: 'dfu_reject' });
		await expect(flashNrf52({ transport, firmware })).rejects.toMatchObject({
			code: 'DfuEnterFailed'
		});
		await transport.disconnect();
	});
});

describe('session state machine', () => {
	it('runs select connect flash provision on simulator', async () => {
		const session = new FlasherSession();
		const firmware = demoFirmware('esp32');
		session.selectFirmware(firmware);
		expect(session.snapshot().phase).toBe('selectTransport');
		await session.connect('sim');
		expect(session.snapshot().connected).toBe(true);
		expect(session.snapshot().identity?.chip).toBe('esp32');
		await session.flash();
		expect(session.snapshot().phase).toBe('provision');
		const provision = await session.runProvision();
		expect(provision.provisioned).toBe(true);
		expect(session.snapshot().phase).toBe('done');
		await session.disconnect();
	});

	it('records abort state', async () => {
		const session = new FlasherSession();
		session.selectFirmware(demoFirmware('esp32'));
		session.abortFlash();
		expect(session.snapshot().phase).toBe('aborted');
		expect(session.snapshot().error?.code).toBe('Aborted');
	});
});

describe('rnode framing', () => {
	it('round-trips status frames', () => {
		const frame = frameCommand(RNODE_CMD_STATUS);
		const parsed = parseResponse(Uint8Array.from([0x3c, 0xa0, 0x01, 0x00, 0xa0 ^ 0x01 ^ 0x00]));
		expect(frame[0]).toBe(0x3c);
		expect(parsed?.ok).toBe(true);
	});
});

describe('catalog helpers', () => {
	it('filters by source and keeps tiny slot coming soon', () => {
		expect(FIRMWARE_SOURCES.some((s) => s.id === 'tiny-reticulum-go' && s.comingSoon)).toBe(true);
		const catalog: FirmwareCatalog = {
			generatedAt: 'now',
			entries: [
				{
					id: 'a',
					name: 'a',
					source: 'official',
					version: '1',
					boardId: 'heltec-v3',
					boardLabel: 'Heltec V3',
					chip: 'esp32s3',
					path: 'official/a.bin',
					sha256: 'abc',
					available: true
				},
				{
					id: 'tiny',
					name: 'tiny',
					source: 'tiny-reticulum-go',
					version: 'pending',
					boardId: 'generic-esp32',
					boardLabel: 'Generic ESP32',
					chip: 'esp32',
					path: '',
					sha256: '',
					available: false,
					comingSoon: true
				}
			]
		};
		expect(filterCatalog(catalog, 'official')).toHaveLength(1);
		expect(filterCatalog(catalog, 'tiny-reticulum-go')[0].comingSoon).toBe(true);
	});

	it('parses known sim faults', () => {
		expect(parseSimFault('bad_verify')).toBe('bad_verify');
		expect(parseSimFault('nope')).toBe('none');
	});
});
