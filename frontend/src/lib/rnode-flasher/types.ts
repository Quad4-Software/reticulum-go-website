/**
 * Shared types for the RNode flasher toolkit.
 */

export type TransportKind = 'serial' | 'bluetooth' | 'ip' | 'sim';

export type ChipFamily = 'esp32' | 'esp32s2' | 'esp32s3' | 'esp32c3' | 'nrf52' | 'unknown';

export type FirmwareSourceId = 'official' | 'microreticulum' | 'tiny-reticulum-go' | 'upload';

export type SessionPhase =
	| 'idle'
	| 'selectFirmware'
	| 'selectTransport'
	| 'connect'
	| 'identify'
	| 'prepareDfu'
	| 'flash'
	| 'verify'
	| 'provision'
	| 'done'
	| 'error'
	| 'aborted';

export type FlashPhase =
	'idle' | 'sync' | 'stub' | 'erase' | 'write' | 'verify' | 'dfu' | 'done' | 'error';

export interface TransportInfo {
	kind: TransportKind;
	label: string;
	connected: boolean;
	baud?: number;
	deviceName?: string;
}

export interface SerialPortFilter {
	usbVendorId?: number;
	usbProductId?: number;
}

export interface ConnectOptions {
	baud?: number;
	filters?: SerialPortFilter[];
	host?: string;
	port?: number;
	signal?: AbortSignal;
	/** Simulator chip profile when kind is sim. */
	simChip?: ChipFamily;
	/** Injected fault id for simulator tests. */
	simFault?: string;
}

export interface DeviceIdentity {
	chip: ChipFamily;
	chipId?: string;
	mac?: string;
	description: string;
}

export interface FirmwareArtifact {
	id: string;
	name: string;
	source: FirmwareSourceId;
	version: string;
	boardId: string;
	boardLabel: string;
	chip: ChipFamily;
	/** Absolute or site-relative URL for bundled/cached assets. */
	url?: string;
	sha256?: string;
	bytes: Uint8Array;
	available: boolean;
	comingSoon?: boolean;
}

export interface CatalogEntry {
	id: string;
	name: string;
	source: FirmwareSourceId;
	version: string;
	boardId: string;
	boardLabel: string;
	chip: ChipFamily;
	path: string;
	sha256: string;
	available: boolean;
	comingSoon?: boolean;
}

export interface FirmwareCatalog {
	generatedAt: string;
	entries: CatalogEntry[];
}

export interface FlashProgress {
	phase: FlashPhase;
	bytesWritten: number;
	bytesTotal: number;
	rateBytesPerSec: number;
	message: string;
}

export interface LogLine {
	ts: number;
	level: 'info' | 'warn' | 'error' | 'debug';
	message: string;
}

export interface ProvisionResult {
	provisioned: boolean;
	firmwareHash?: string;
	message: string;
}
