import { describe, it, expect } from 'vitest';
import {
	findMicronColors,
	hex6ToMicron,
	micronToHex6,
	replaceMicronColorAt
} from './micron-colors';

describe('micron-colors', () => {
	it('converts between micron hex3 and css hex6', () => {
		expect(micronToHex6('0a0')).toBe('#00aa00');
		expect(hex6ToMicron('#00aa00')).toBe('0a0');
		expect(hex6ToMicron('#00ADD8')).toBe('0ad');
	});

	it('finds F and B color tags in source', () => {
		const matches = findMicronColors('`Faaa`B333 text `f`b');
		expect(matches).toHaveLength(2);
		expect(matches[0]).toMatchObject({ kind: 'F', hex3: 'aaa' });
		expect(matches[1]).toMatchObject({ kind: 'B', hex3: '333' });
	});

	it('replaces a single color occurrence', () => {
		const source = '`Faaa hello `F000';
		const [first] = findMicronColors(source);
		expect(replaceMicronColorAt(source, first, '0a0')).toBe('`F0a0 hello `F000');
	});
});
