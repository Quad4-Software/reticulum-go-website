import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	buildAgentContextPayload,
	buildLlmsFullTxt,
	buildLlmsTxt,
	markdownResponse,
	jsonResponse
} from './agent-context';

const root = resolve(import.meta.dirname, '../..');

describe('agent endpoint wiring', () => {
	it('registers prerendered llms and agent routes', () => {
		expect(existsSync(resolve(root, 'src/routes/llms.txt/+server.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'src/routes/llms-full.txt/+server.ts'))).toBe(true);
		expect(existsSync(resolve(root, 'src/routes/api/agent/+server.ts'))).toBe(true);

		const llmsRoute = readFileSync(resolve(root, 'src/routes/llms.txt/+server.ts'), 'utf8');
		const fullRoute = readFileSync(resolve(root, 'src/routes/llms-full.txt/+server.ts'), 'utf8');
		const agentRoute = readFileSync(resolve(root, 'src/routes/api/agent/+server.ts'), 'utf8');
		expect(llmsRoute).toContain('prerender = true');
		expect(fullRoute).toContain('buildLlmsFullTxt');
		expect(agentRoute).toContain('buildAgentContextPayload');
	});

	it('mentions agent endpoints in robots.txt', () => {
		const robots = readFileSync(resolve(root, 'static/robots.txt'), 'utf8');
		expect(robots).toContain('/llms.txt');
		expect(robots).toContain('/api/agent');
	});

	it('response helpers set markdown and json content types', async () => {
		const md = markdownResponse(buildLlmsTxt());
		expect(md.headers.get('Content-Type')).toMatch(/text\/markdown/);
		expect(await md.text()).toContain('Zen of Reticulum');

		const json = jsonResponse(buildAgentContextPayload());
		expect(json.headers.get('Content-Type')).toMatch(/application\/json/);
		expect(JSON.parse(await json.text()).format).toBe('reticulum-go-agent-context');
	});

	it('full brief is longer than the compact llms.txt', () => {
		expect(buildLlmsFullTxt().length).toBeGreaterThan(buildLlmsTxt().length);
	});
});
