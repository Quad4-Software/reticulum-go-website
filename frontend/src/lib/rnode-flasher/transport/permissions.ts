/**
 * Browser capability helpers for flasher transports.
 *
 * Web Serial and Web Bluetooth require a secure context and are only
 * implemented in Chromium based browsers today. Firefox and WebKit do not
 * expose these APIs. See MDN Web Serial API and Web Bluetooth API.
 */

export type PermissionCapability = 'supported' | 'unsupported' | 'insecure_context' | 'unknown';

export type BrowserEngine = 'chromium' | 'firefox' | 'webkit' | 'other' | 'unknown';

export interface NavigatorSerialLike {
	requestPort?: (options?: object) => Promise<unknown>;
	getPorts?: () => Promise<unknown[]>;
}

export interface NavigatorBluetoothLike {
	requestDevice?: (options?: object) => Promise<unknown>;
	getAvailability?: () => Promise<boolean>;
}

export interface CapabilityProbe {
	hasWindow: boolean;
	isSecureContext: boolean;
	userAgent: string;
	serial?: NavigatorSerialLike | null;
	bluetooth?: NavigatorBluetoothLike | null;
	hasWebSocket: boolean;
	/** True when navigator.brave exists (Brave browser fingerprint helper). */
	hasBraveNavigator?: boolean;
}

/** Build a probe from the current global environment. */
export function probeEnvironment(
	win: Window | undefined = typeof window !== 'undefined' ? window : undefined,
	nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined
): CapabilityProbe {
	if (!win || !nav) {
		return {
			hasWindow: false,
			isSecureContext: false,
			userAgent: '',
			serial: null,
			bluetooth: null,
			hasWebSocket: false,
			hasBraveNavigator: false
		};
	}
	const serial =
		'serial' in nav ? ((nav as Navigator & { serial?: NavigatorSerialLike }).serial ?? null) : null;
	const bluetooth =
		'bluetooth' in nav
			? ((nav as Navigator & { bluetooth?: NavigatorBluetoothLike }).bluetooth ?? null)
			: null;
	return {
		hasWindow: true,
		isSecureContext: Boolean(win.isSecureContext),
		userAgent: nav.userAgent || '',
		serial,
		bluetooth,
		hasWebSocket: typeof (win as Window & { WebSocket?: unknown }).WebSocket === 'function',
		hasBraveNavigator: 'brave' in nav
	};
}

/** Sync Brave heuristic used when async isBrave is unavailable. */
export function looksLikeBrave(probe: CapabilityProbe): boolean {
	if (probe.hasBraveNavigator) return true;
	return /brave/i.test(probe.userAgent);
}

/**
 * Detect Brave. Prefers navigator.brave.isBrave when present.
 */
export async function detectBrave(
	nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined
): Promise<boolean> {
	if (!nav) return false;
	const brave = (nav as Navigator & { brave?: { isBrave?: () => Promise<boolean> } }).brave;
	if (brave && typeof brave.isBrave === 'function') {
		try {
			return Boolean(await brave.isBrave());
		} catch {
			/* fall through to UA */
		}
	}
	return /brave/i.test(nav.userAgent || '');
}

/** True when Brave is in use and Serial or Bluetooth APIs are missing. */
export function needsBraveEnableHelp(
	isBrave: boolean,
	serialCap: PermissionCapability,
	bluetoothCap: PermissionCapability
): boolean {
	if (!isBrave) return false;
	return serialCap === 'unsupported' || bluetoothCap === 'unsupported';
}

/** Best effort engine classification for support messaging. */
export function detectBrowserEngine(userAgent: string): BrowserEngine {
	const ua = userAgent.toLowerCase();
	if (!ua) return 'unknown';
	if (ua.includes('firefox/')) return 'firefox';
	if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('chromium/')) {
		return 'webkit';
	}
	if (
		ua.includes('chrome/') ||
		ua.includes('chromium/') ||
		ua.includes('edg/') ||
		ua.includes('brave') ||
		ua.includes('opr/')
	) {
		return 'chromium';
	}
	return 'other';
}

function hasSerialApi(serial: NavigatorSerialLike | null | undefined): boolean {
	return Boolean(serial && typeof serial.requestPort === 'function');
}

function hasBluetoothApi(bluetooth: NavigatorBluetoothLike | null | undefined): boolean {
	return Boolean(bluetooth && typeof bluetooth.requestDevice === 'function');
}

export function serialCapabilityFromProbe(probe: CapabilityProbe): PermissionCapability {
	if (!probe.hasWindow) return 'unknown';
	if (!probe.isSecureContext) return 'insecure_context';
	if (!hasSerialApi(probe.serial)) return 'unsupported';
	return 'supported';
}

export function bluetoothCapabilityFromProbe(probe: CapabilityProbe): PermissionCapability {
	if (!probe.hasWindow) return 'unknown';
	if (!probe.isSecureContext) return 'insecure_context';
	if (!hasBluetoothApi(probe.bluetooth)) return 'unsupported';
	return 'supported';
}

export function ipCapabilityFromProbe(probe: CapabilityProbe): PermissionCapability {
	if (!probe.hasWindow) return 'unknown';
	if (!probe.hasWebSocket) return 'unsupported';
	return 'supported';
}

export function serialCapability(): PermissionCapability {
	return serialCapabilityFromProbe(probeEnvironment());
}

export function bluetoothCapability(): PermissionCapability {
	return bluetoothCapabilityFromProbe(probeEnvironment());
}

export function ipCapability(): PermissionCapability {
	return ipCapabilityFromProbe(probeEnvironment());
}

/** i18n key suffix under tools.rnode_flasher.cap_* */
export function capabilityI18nKey(cap: PermissionCapability): string {
	switch (cap) {
		case 'supported':
			return 'cap_supported';
		case 'unsupported':
			return 'cap_unsupported';
		case 'insecure_context':
			return 'cap_insecure';
		default:
			return 'cap_unknown';
	}
}

/** English fallback labels used by tests and non i18n callers. */
export function capabilityLabel(cap: PermissionCapability): string {
	switch (cap) {
		case 'supported':
			return 'Supported';
		case 'unsupported':
			return 'Not supported in this browser';
		case 'insecure_context':
			return 'Requires HTTPS';
		default:
			return 'Unavailable';
	}
}

export function engineSupportNoteKey(engine: BrowserEngine): string {
	switch (engine) {
		case 'chromium':
			return 'engine_note_chromium';
		case 'firefox':
			return 'engine_note_firefox';
		case 'webkit':
			return 'engine_note_webkit';
		default:
			return 'engine_note_other';
	}
}
