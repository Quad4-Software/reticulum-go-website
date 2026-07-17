/**
 * Simulator fault identifiers for CI and UI demos.
 */

export type SimFaultId =
	'none' | 'timeout' | 'bad_verify' | 'disconnect_mid_write' | 'wrong_chip' | 'dfu_reject';

export function parseSimFault(raw?: string): SimFaultId {
	switch (raw) {
		case 'timeout':
		case 'bad_verify':
		case 'disconnect_mid_write':
		case 'wrong_chip':
		case 'dfu_reject':
			return raw;
		default:
			return 'none';
	}
}
