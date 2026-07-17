import { describe, it, expect } from 'vitest';
import {
	bluetoothCapabilityFromProbe,
	capabilityI18nKey,
	capabilityLabel,
	detectBrave,
	detectBrowserEngine,
	engineSupportNoteKey,
	ipCapabilityFromProbe,
	looksLikeBrave,
	needsBraveEnableHelp,
	probeEnvironment,
	serialCapabilityFromProbe,
	type CapabilityProbe
} from './transport/permissions';

function probe(partial: Partial<CapabilityProbe>): CapabilityProbe {
	return {
		hasWindow: true,
		isSecureContext: true,
		userAgent: 'Mozilla/5.0',
		serial: null,
		bluetooth: null,
		hasWebSocket: true,
		...partial
	};
}

describe('flasher permissions', () => {
	it('labels capability states', () => {
		expect(capabilityLabel('supported')).toBe('Supported');
		expect(capabilityLabel('unsupported')).toContain('Not supported');
		expect(capabilityLabel('unknown')).toBe('Unavailable');
		expect(capabilityI18nKey('insecure_context')).toBe('cap_insecure');
	});

	it('marks serial supported only with requestPort in a secure context', () => {
		expect(
			serialCapabilityFromProbe(
				probe({ serial: { requestPort: async () => ({}) }, isSecureContext: true })
			)
		).toBe('supported');
		expect(
			serialCapabilityFromProbe(
				probe({ serial: { requestPort: async () => ({}) }, isSecureContext: false })
			)
		).toBe('insecure_context');
		expect(serialCapabilityFromProbe(probe({ serial: {} }))).toBe('unsupported');
		expect(serialCapabilityFromProbe(probe({ hasWindow: false }))).toBe('unknown');
	});

	it('marks bluetooth supported only with requestDevice in a secure context', () => {
		expect(
			bluetoothCapabilityFromProbe(
				probe({ bluetooth: { requestDevice: async () => ({}) }, isSecureContext: true })
			)
		).toBe('supported');
		expect(bluetoothCapabilityFromProbe(probe({ bluetooth: null }))).toBe('unsupported');
		expect(
			bluetoothCapabilityFromProbe(
				probe({ bluetooth: { requestDevice: async () => ({}) }, isSecureContext: false })
			)
		).toBe('insecure_context');
	});

	it('marks IP supported when WebSocket exists', () => {
		expect(ipCapabilityFromProbe(probe({ hasWebSocket: true }))).toBe('supported');
		expect(ipCapabilityFromProbe(probe({ hasWebSocket: false }))).toBe('unsupported');
		expect(ipCapabilityFromProbe(probe({ hasWindow: false, hasWebSocket: false }))).toBe('unknown');
	});

	it('classifies browser engines for support notes', () => {
		expect(detectBrowserEngine('Mozilla/5.0 Firefox/128.0')).toBe('firefox');
		expect(
			detectBrowserEngine(
				'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
			)
		).toBe('webkit');
		expect(detectBrowserEngine('Mozilla/5.0 Chrome/126.0.0.0 Safari/537.36')).toBe('chromium');
		expect(detectBrowserEngine('Mozilla/5.0 Edg/126.0.0.0')).toBe('chromium');
		expect(engineSupportNoteKey('firefox')).toBe('engine_note_firefox');
		expect(engineSupportNoteKey('webkit')).toBe('engine_note_webkit');
		expect(engineSupportNoteKey('chromium')).toBe('engine_note_chromium');
	});

	it('builds a live probe without throwing', () => {
		const live = probeEnvironment();
		expect(typeof live.hasWindow).toBe('boolean');
		expect(typeof live.hasWebSocket).toBe('boolean');
	});

	it('detects Brave and when enable help is needed', async () => {
		expect(looksLikeBrave(probe({ hasBraveNavigator: true }))).toBe(true);
		expect(looksLikeBrave(probe({ userAgent: 'Mozilla/5.0 Brave Chrome/126' }))).toBe(true);
		expect(looksLikeBrave(probe({ userAgent: 'Mozilla/5.0 Chrome/126' }))).toBe(false);
		expect(needsBraveEnableHelp(true, 'unsupported', 'supported')).toBe(true);
		expect(needsBraveEnableHelp(true, 'supported', 'unsupported')).toBe(true);
		expect(needsBraveEnableHelp(true, 'supported', 'supported')).toBe(false);
		expect(needsBraveEnableHelp(false, 'unsupported', 'unsupported')).toBe(false);

		const fakeNav = {
			userAgent: 'Chrome/126',
			brave: { isBrave: async () => true }
		} as unknown as Navigator;
		expect(await detectBrave(fakeNav)).toBe(true);
		expect(await detectBrave({ userAgent: 'Chrome/126' } as Navigator)).toBe(false);
	});
});
