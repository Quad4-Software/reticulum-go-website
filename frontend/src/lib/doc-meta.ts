export type DocMetaField = { label: string; value: string };

function cellText(cell: Element | undefined | null): string {
	return (cell?.textContent ?? '').trim();
}

function headerCells(table: HTMLTableElement): Element[] {
	const firstRow = table.querySelector('thead tr') ?? table.querySelector('tr');
	if (!firstRow) return [];
	return Array.from(firstRow.querySelectorAll('th, td'));
}

/** True if table looks like the Field|Value doc metadata block. */
export function isDocMetaTable(table: HTMLTableElement): boolean {
	const cells = headerCells(table);
	if (cells.length < 2) return false;
	return (
		cellText(cells[0]).toLowerCase() === 'field' && cellText(cells[1]).toLowerCase() === 'value'
	);
}

/** Parse Field/Value rows from the table (skip header). */
export function parseDocMetaTable(table: HTMLTableElement): DocMetaField[] {
	const rows = Array.from(table.querySelectorAll('tr'));
	if (rows.length < 2) return [];

	const fields: DocMetaField[] = [];
	for (const row of rows.slice(1)) {
		const cells = Array.from(row.querySelectorAll('th, td'));
		if (cells.length < 2) continue;
		const label = cellText(cells[0]);
		const value = cellText(cells[1]);
		if (!label && !value) continue;
		fields.push({ label, value });
	}
	return fields;
}

/**
 * Find the metadata table in a rendered prose root: first table that is a
 * Field/Value meta table (typically right after the H1).
 */
export function findDocMetaTable(root: HTMLElement): HTMLTableElement | null {
	const tables = Array.from(root.querySelectorAll('table'));
	for (const table of tables) {
		if (isDocMetaTable(table)) return table;
	}
	return null;
}
