import { describe, it, expect } from 'vitest';
import {
	AGENT_MUST_NOT,
	RETICULUM_ZEN,
	RETICULUM_MANUAL,
	RETICULUM_WHATIS,
	buildAgentContextPayload,
	buildLlmsFullTxt,
	buildLlmsTxt
} from './agent-context';

describe('agent context', () => {
	it('builds llms.txt with Zen, manual, and anti-replacement rules', () => {
		const text = buildLlmsTxt();
		expect(text.startsWith('# reticulum-go.quad4.io')).toBe(true);
		expect(text).toContain(RETICULUM_ZEN);
		expect(text).toContain(RETICULUM_MANUAL);
		expect(text).toContain(RETICULUM_WHATIS);
		expect(text).toContain('does not replace');
		expect(text).toContain('/api/agent');
		expect(text).toContain('/tools/reticulum-guide');
		expect(text).toContain('/source');
		expect(text).toContain('/download/reticulum-go.zip');
		expect(text).toContain('DOCS_CACHE_DIR');
		expect(text).toContain('rns://06a54b505bb67b25ef3f8097e8001edc/public/Reticulum-Go');
		expect(text).toContain('lavaforge.org/Ivan/Reticulum-Go');
		expect(text).not.toContain('\u2014');
	});

	it('builds a fuller brief with verified protocol anchors', () => {
		const text = buildLlmsFullTxt();
		expect(text).toContain('PATHFINDER_M');
		expect(text).toContain('AES-256-CBC');
		expect(text).toContain('16 bytes');
		expect(text).toContain('RNode');
		expect(text).toContain('not implemented');
		expect(text).toContain('/docs/compatibility');
		expect(text).toContain('/source');
	});

	it('exposes a versioned JSON payload for agents', () => {
		const payload = buildAgentContextPayload();
		expect(payload.format).toBe('reticulum-go-agent-context');
		expect(payload.version).toBe(1);
		expect(payload.must_not).toEqual(AGENT_MUST_NOT);
		expect(payload.canonical.reticulum_zen).toBe(RETICULUM_ZEN);
		expect(payload.markdown.llms_txt).toContain('Must not');
	});

	it('forbids common hallucination patterns in must_not', () => {
		const joined = AGENT_MUST_NOT.join(' ').toLowerCase();
		expect(joined).toContain('replace');
		expect(joined).toContain('one global network');
		expect(joined).toContain('rnode');
		expect(joined).toContain('aead');
	});
});
