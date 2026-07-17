/**
 * Flash progress event helpers.
 */

import type { FlashPhase, FlashProgress } from '../types';

export function makeProgress(
	phase: FlashPhase,
	bytesWritten: number,
	bytesTotal: number,
	startedAt: number,
	message: string
): FlashProgress {
	const elapsed = Math.max(0.001, (Date.now() - startedAt) / 1000);
	return {
		phase,
		bytesWritten,
		bytesTotal,
		rateBytesPerSec: bytesWritten / elapsed,
		message
	};
}

export type ProgressHandler = (p: FlashProgress) => void;
