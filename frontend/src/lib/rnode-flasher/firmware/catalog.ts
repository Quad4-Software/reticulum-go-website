/**
 * Bundled firmware catalog loader.
 */

import type { CatalogEntry, FirmwareArtifact, FirmwareCatalog, FirmwareSourceId } from '../types';
import { FlasherError } from '../errors';
import seedCatalogJson from '../../../../static/rnode-firmware/catalog.json';

const CATALOG_URL = '/rnode-firmware/catalog.json';

/** Catalog baked into the app bundle for first paint and offline fallback. */
export function getSeedCatalog(): FirmwareCatalog {
	const data = seedCatalogJson as FirmwareCatalog;
	return {
		generatedAt: data.generatedAt ?? '',
		entries: Array.isArray(data.entries) ? [...data.entries] : []
	};
}

export type LoadCatalogOptions = {
	/** Bypass HTTP and service worker caches. */
	bustCache?: boolean;
};

export async function loadBundledCatalog(
	options: LoadCatalogOptions = {}
): Promise<FirmwareCatalog> {
	try {
		const url = options.bustCache ? `${CATALOG_URL}?t=${Date.now()}` : CATALOG_URL;
		const res = await fetch(url, {
			cache: options.bustCache ? 'reload' : 'no-cache'
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}`);
		}
		const data = (await res.json()) as FirmwareCatalog;
		if (!Array.isArray(data.entries)) {
			throw new Error('invalid catalog shape');
		}
		return data;
	} catch (err) {
		throw new FlasherError(
			'CatalogUnavailable',
			'Could not load firmware catalog',
			err instanceof Error ? err.message : String(err),
			'Use Upload or retry when online'
		);
	}
}

export function filterCatalog(catalog: FirmwareCatalog, source?: FirmwareSourceId): CatalogEntry[] {
	return catalog.entries.filter((e) => (source ? e.source === source : true));
}

export async function loadCatalogArtifact(entry: CatalogEntry): Promise<FirmwareArtifact> {
	if (!entry.available || entry.comingSoon) {
		throw new FlasherError(
			'CatalogUnavailable',
			`${entry.name} is not available yet`,
			entry.id,
			'Pick another source or upload a local firmware file'
		);
	}
	const url = entry.path.startsWith('/') ? entry.path : `/rnode-firmware/${entry.path}`;
	const res = await fetch(url);
	if (!res.ok) {
		throw new FlasherError(
			'CatalogUnavailable',
			`Failed to download ${entry.name}`,
			`HTTP ${res.status}`,
			'Retry online or use Upload'
		);
	}
	const bytes = new Uint8Array(await res.arrayBuffer());
	return {
		id: entry.id,
		name: entry.name,
		source: entry.source,
		version: entry.version,
		boardId: entry.boardId,
		boardLabel: entry.boardLabel,
		chip: entry.chip,
		url,
		sha256: entry.sha256,
		bytes,
		available: true,
		comingSoon: entry.comingSoon
	};
}
