/**
 * Typed flasher errors with user-facing guidance.
 */

export type FlasherErrorCode =
	| 'SerialUnsupported'
	| 'SerialPermissionDenied'
	| 'BluetoothUnsupported'
	| 'BluetoothPermissionDenied'
	| 'IpConnectFailed'
	| 'PortBusy'
	| 'ChipMismatch'
	| 'BoardMismatch'
	| 'StubLoadFailed'
	| 'DfuEnterFailed'
	| 'FlashVerifyMismatch'
	| 'DisconnectDuringFlash'
	| 'FirmwareChecksumFailed'
	| 'ProvisionFailed'
	| 'CatalogUnavailable'
	| 'ArtifactParseFailed'
	| 'Aborted'
	| 'Unknown';

export class FlasherError extends Error {
	readonly code: FlasherErrorCode;
	readonly detail: string;
	readonly suggestion: string;

	constructor(code: FlasherErrorCode, message: string, detail = '', suggestion = '') {
		super(message);
		this.name = 'FlasherError';
		this.code = code;
		this.detail = detail;
		this.suggestion = suggestion;
	}
}

export function flasherErrorFromUnknown(err: unknown): FlasherError {
	if (err instanceof FlasherError) return err;
	if (err instanceof DOMException && err.name === 'NotFoundError') {
		return new FlasherError(
			'SerialPermissionDenied',
			'No serial device was selected',
			err.message,
			'Click Connect and choose your board in the browser prompt'
		);
	}
	if (err instanceof DOMException && err.name === 'SecurityError') {
		return new FlasherError(
			'SerialPermissionDenied',
			'Browser blocked device access',
			err.message,
			'Allow the permission when prompted and use HTTPS'
		);
	}
	const message = err instanceof Error ? err.message : String(err);
	return new FlasherError(
		'Unknown',
		message || 'Unexpected flasher error',
		message,
		'Retry the step'
	);
}
