/**
 * Micron 3-nibble color helpers (same model as rns-micron-vsix).
 */

const COLOR_TAG_RE = /`([FB])([0-9a-fA-F]{3})/g;

export type MicronColorMatch = {
	index: number;
	kind: 'F' | 'B';
	hex3: string;
	/** Inclusive start of the 3-digit hex inside the source string. */
	hexStart: number;
	hexEnd: number;
	/** 0-based line of the match. */
	line: number;
	/** 0-based column of hexStart on that line. */
	column: number;
};

export function micronToHex6(hex3: string): string {
	const h = hex3.toLowerCase();
	return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}

export function hex6ToMicron(hex6: string): string {
	const raw = hex6.trim().replace(/^#/, '').toLowerCase();
	if (!/^[0-9a-f]{6}$/.test(raw)) return '000';
	const toNibble = (pair: string) => {
		const n = Math.round(parseInt(pair, 16) / 17);
		return Math.max(0, Math.min(15, n)).toString(16);
	};
	return `${toNibble(raw.slice(0, 2))}${toNibble(raw.slice(2, 4))}${toNibble(raw.slice(4, 6))}`;
}

function lineColumnAt(source: string, offset: number): { line: number; column: number } {
	let line = 0;
	let lastNl = -1;
	for (let i = 0; i < offset && i < source.length; i++) {
		if (source[i] === '\n') {
			line += 1;
			lastNl = i;
		}
	}
	return { line, column: offset - (lastNl + 1) };
}

export function findMicronColors(source: string): MicronColorMatch[] {
	const out: MicronColorMatch[] = [];
	COLOR_TAG_RE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = COLOR_TAG_RE.exec(source)) !== null) {
		const kind = match[1] as 'F' | 'B';
		const hex3 = match[2].toLowerCase();
		const hexStart = match.index + 2;
		const { line, column } = lineColumnAt(source, hexStart);
		out.push({
			index: match.index,
			kind,
			hex3,
			hexStart,
			hexEnd: hexStart + 3,
			line,
			column
		});
	}
	return out;
}

export function replaceMicronColorAt(
	source: string,
	match: MicronColorMatch,
	nextHex3: string
): string {
	const hex = nextHex3.toLowerCase().slice(0, 3).padEnd(3, '0');
	if (!/^[0-9a-f]{3}$/.test(hex)) return source;
	return source.slice(0, match.hexStart) + hex + source.slice(match.hexEnd);
}
