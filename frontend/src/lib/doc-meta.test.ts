import { describe, expect, it } from 'vitest';
import { findDocMetaTable, isDocMetaTable, parseDocMetaTable } from './doc-meta';

function tableFromHtml(html: string): HTMLTableElement {
	const wrap = document.createElement('div');
	wrap.innerHTML = html;
	const table = wrap.querySelector('table');
	if (!table) throw new Error('expected table');
	return table;
}

describe('doc-meta', () => {
	it('detects Field|Value metadata tables', () => {
		const table = tableFromHtml(`
			<table>
				<thead><tr><th>Field</th><th>Value</th></tr></thead>
				<tbody>
					<tr><td>Document version</td><td>1.0</td></tr>
					<tr><td>Author</td><td>Ivan</td></tr>
				</tbody>
			</table>
		`);
		expect(isDocMetaTable(table)).toBe(true);
	});

	it('rejects ordinary content tables', () => {
		const table = tableFromHtml(`
			<table>
				<thead><tr><th>Python</th><th>Go</th></tr></thead>
				<tbody><tr><td>RNS</td><td>reticulum</td></tr></tbody>
			</table>
		`);
		expect(isDocMetaTable(table)).toBe(false);
	});

	it('parses metadata rows', () => {
		const table = tableFromHtml(`
			<table>
				<tr><th>Field</th><th>Value</th></tr>
				<tr><td>Document version</td><td>1.1</td></tr>
				<tr><td>Last updated</td><td>2026-07-09</td></tr>
				<tr><td>Protocol target</td><td>Python RNS 1.3.7</td></tr>
			</table>
		`);
		expect(parseDocMetaTable(table)).toEqual([
			{ label: 'Document version', value: '1.1' },
			{ label: 'Last updated', value: '2026-07-09' },
			{ label: 'Protocol target', value: 'Python RNS 1.3.7' }
		]);
	});

	it('finds the first Field|Value table in a prose root', () => {
		const root = document.createElement('div');
		root.innerHTML = `
			<h1>Overview</h1>
			<table>
				<tr><th>Field</th><th>Value</th></tr>
				<tr><td>Author</td><td>Ivan</td></tr>
			</table>
			<table>
				<tr><th>A</th><th>B</th></tr>
				<tr><td>1</td><td>2</td></tr>
			</table>
		`;
		const found = findDocMetaTable(root);
		expect(found).not.toBeNull();
		expect(parseDocMetaTable(found!).map((f) => f.label)).toEqual(['Author']);
	});
});
