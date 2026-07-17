/**
 * RNode EEPROM provision and firmware hash helpers.
 */

import type { DeviceTransport } from '../transport/types';
import type { FirmwareArtifact, ProvisionResult } from '../types';
import { FlasherError } from '../errors';
import {
	frameCommand,
	parseResponse,
	RNODE_CMD_HASH,
	RNODE_CMD_PROVISION,
	RNODE_CMD_STATUS,
	sha256Hex
} from './framing';

async function roundTrip(transport: DeviceTransport, frame: Uint8Array): Promise<Uint8Array> {
	await transport.write(frame);
	return transport.read(256);
}

export async function readProvisionStatus(
	transport: DeviceTransport
): Promise<'virgin' | 'provisioned' | 'unknown'> {
	try {
		const resp = await roundTrip(transport, frameCommand(RNODE_CMD_STATUS));
		const parsed = parseResponse(resp);
		if (!parsed) return 'unknown';
		if (parsed.payload[0] === 0x00) return 'virgin';
		if (parsed.payload[0] === 0x01) return 'provisioned';
		return 'unknown';
	} catch {
		return 'unknown';
	}
}

export async function provisionDevice(
	transport: DeviceTransport,
	firmware: FirmwareArtifact
): Promise<ProvisionResult> {
	const status = await readProvisionStatus(transport);
	if (status === 'provisioned') {
		return {
			provisioned: true,
			message: 'Device already provisioned'
		};
	}

	const hashHex = firmware.sha256 ?? (await sha256Hex(firmware.bytes));
	const hashBytes = new Uint8Array(hashHex.match(/.{1,2}/g)!.map((h) => parseInt(h, 16)));

	try {
		const provResp = await roundTrip(
			transport,
			frameCommand(RNODE_CMD_PROVISION, new Uint8Array([0x01]))
		);
		const provParsed = parseResponse(provResp);
		if (!provParsed?.ok && status === 'virgin') {
			throw new FlasherError(
				'ProvisionFailed',
				'EEPROM provision failed',
				'',
				'Keep USB connected and retry provision'
			);
		}

		const hashResp = await roundTrip(
			transport,
			frameCommand(RNODE_CMD_HASH, hashBytes.slice(0, 32))
		);
		const hashParsed = parseResponse(hashResp);
		if (!hashParsed?.ok && transport.kind !== 'sim') {
			throw new FlasherError(
				'ProvisionFailed',
				'Setting firmware hash failed',
				'',
				'Reboot the board and run Set Hash again'
			);
		}

		return {
			provisioned: true,
			firmwareHash: hashHex,
			message: 'Provisioned EEPROM and firmware hash'
		};
	} catch (err) {
		if (err instanceof FlasherError) throw err;
		if (transport.kind === 'sim') {
			return {
				provisioned: true,
				firmwareHash: hashHex,
				message: 'Simulator provision complete'
			};
		}
		throw new FlasherError(
			'ProvisionFailed',
			'Provision flow failed',
			err instanceof Error ? err.message : String(err),
			'Retry after a successful flash'
		);
	}
}
