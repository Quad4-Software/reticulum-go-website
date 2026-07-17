/**
 * Flash engine shared types.
 */

import type { DeviceIdentity, FirmwareArtifact } from '../types';
import type { DeviceTransport } from '../transport/types';
import type { ProgressHandler } from './progress';

export interface FlashOptions {
	transport: DeviceTransport;
	firmware: FirmwareArtifact;
	onProgress?: ProgressHandler;
	signal?: AbortSignal;
	erase?: boolean;
}

export interface FlashResult {
	identity: DeviceIdentity;
	verified: boolean;
	bytesWritten: number;
}
