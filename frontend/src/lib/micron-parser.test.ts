import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	MICRON_WASM_PATH,
	MICRON_WASM_EXEC_PATH,
	convertMicron,
	resetMicronParserForTest
} from './micron-parser';

describe('micron-parser helpers', () => {
	beforeEach(() => {
		resetMicronParserForTest();
	});

	afterEach(() => {
		resetMicronParserForTest();
		vi.restoreAllMocks();
	});

	it('exposes the vendored wasm and matching wasm_exec paths', () => {
		expect(MICRON_WASM_PATH).toBe('/micron-parser-go.wasm');
		expect(MICRON_WASM_EXEC_PATH).toBe('/micron-wasm_exec.js');
	});

	it('convertMicron throws before wasm is ready', () => {
		expect(() => convertMicron('> Hi')).toThrow(/micronConvert is not available/);
	});

	it('convertMicron delegates to the global when loaded', () => {
		window.micronConvert = vi.fn(() => '<div>ok</div>');
		expect(convertMicron('> Hi', false, false)).toBe('<div>ok</div>');
		expect(window.micronConvert).toHaveBeenCalledWith('> Hi', false, false);
	});
});
