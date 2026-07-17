/**
 * Parse uploaded firmware artifacts.
 */

import type { ChipFamily, FirmwareArtifact, FirmwareSourceId } from '../types';
import { FlasherError } from '../errors';
import { sha256Hex } from '../rnode/framing';

function guessChip(name: string): ChipFamily {
	const n = name.toLowerCase();
	if (n.includes('nrf') || n.includes('rak4631') || n.includes('techo') || n.includes('t-echo')) {
		return 'nrf52';
	}
	if (n.includes('s3')) return 'esp32s3';
	if (n.includes('c3')) return 'esp32c3';
	if (n.includes('s2')) return 'esp32s2';
	if (n.includes('esp32')) return 'esp32';
	return 'unknown';
}

function guessBoard(name: string): { id: string; label: string } {
	const n = name.toLowerCase();
	if (n.includes('heltec') && n.includes('v3')) return { id: 'heltec-v3', label: 'Heltec V3' };
	if (n.includes('heltec')) return { id: 'heltec-v2', label: 'Heltec V2' };
	if (n.includes('tbeam') || n.includes('t-beam')) return { id: 'tbeam', label: 'T-Beam' };
	if (n.includes('tdeck') || n.includes('t-deck')) return { id: 't-deck', label: 'T-Deck' };
	if (n.includes('rak4631')) return { id: 'rak4631', label: 'RAK4631' };
	if (n.includes('techo') || n.includes('t-echo')) return { id: 't-echo', label: 'T-Echo' };
	const chip = guessChip(name);
	if (chip === 'nrf52') return { id: 'generic-nrf52', label: 'Generic nRF52' };
	return { id: 'generic-esp32', label: 'Generic ESP32' };
}

export async function parseFirmwareFile(file: File): Promise<FirmwareArtifact> {
	const name = file.name;
	const lower = name.toLowerCase();
	if (!lower.endsWith('.bin') && !lower.endsWith('.zip')) {
		throw new FlasherError(
			'ArtifactParseFailed',
			'Unsupported firmware file type',
			name,
			'Upload a .bin or .zip firmware package'
		);
	}

	const buffer = new Uint8Array(await file.arrayBuffer());
	if (buffer.byteLength < 256) {
		throw new FlasherError(
			'ArtifactParseFailed',
			'Firmware file is too small',
			`${buffer.byteLength} bytes`,
			'Confirm you selected a full firmware image'
		);
	}

	let bytes = buffer;
	if (lower.endsWith('.zip')) {
		bytes = new Uint8Array(await extractPreferredBinFromZip(buffer, name));
	}

	const board = guessBoard(name);
	const chip = guessChip(name);
	const sha256 = await sha256Hex(bytes);
	const source: FirmwareSourceId = 'upload';

	return {
		id: `upload-${sha256.slice(0, 12)}`,
		name,
		source,
		version: 'local',
		boardId: board.id,
		boardLabel: board.label,
		chip,
		sha256,
		bytes,
		available: true
	};
}

async function extractPreferredBinFromZip(data: Uint8Array, zipName: string): Promise<Uint8Array> {
	const text = new TextDecoder('latin1').decode(data);
	const binMarker = '.bin';
	const idx = text.toLowerCase().lastIndexOf(binMarker);
	if (idx < 0) {
		throw new FlasherError(
			'ArtifactParseFailed',
			'ZIP did not contain a .bin image',
			zipName,
			'Upload a package that includes a firmware .bin'
		);
	}
	const localHeader = text.lastIndexOf('PK\x03\x04', idx);
	if (localHeader < 0) {
		return data;
	}
	const view = new DataView(data.buffer, data.byteOffset + localHeader);
	const nameLen = view.getUint16(26, true);
	const extraLen = view.getUint16(28, true);
	const compSize = view.getUint32(18, true);
	const compMethod = view.getUint16(8, true);
	const dataStart = localHeader + 30 + nameLen + extraLen;
	const slice = data.slice(dataStart, dataStart + compSize);
	if (compMethod === 0) return slice;
	throw new FlasherError(
		'ArtifactParseFailed',
		'ZIP entry is compressed and cannot be extracted in-browser yet',
		zipName,
		'Upload an uncompressed .bin or a store-only zip'
	);
}
