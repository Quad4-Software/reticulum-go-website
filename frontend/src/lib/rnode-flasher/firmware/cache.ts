/**
 * IndexedDB cache for flasher firmwares and last session metadata.
 */

import type { FirmwareArtifact } from '../types';

const DB_NAME = 'rnode-flasher';
const DB_VERSION = 1;
const STORE = 'firmwares';
const META = 'meta';

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
			if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function cacheFirmware(artifact: FirmwareArtifact): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put(
			{
				id: artifact.id,
				name: artifact.name,
				source: artifact.source,
				version: artifact.version,
				boardId: artifact.boardId,
				boardLabel: artifact.boardLabel,
				chip: artifact.chip,
				sha256: artifact.sha256,
				bytes: artifact.bytes
			},
			artifact.id
		);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}

export async function loadCachedFirmware(id: string): Promise<FirmwareArtifact | null> {
	if (typeof indexedDB === 'undefined') return null;
	const db = await openDb();
	const row = await new Promise<FirmwareArtifact | null>((resolve, reject) => {
		const tx = db.transaction(STORE, 'readonly');
		const req = tx.objectStore(STORE).get(id);
		req.onsuccess = () => {
			const v = req.result as FirmwareArtifact | undefined;
			resolve(v ? { ...v, available: true } : null);
		};
		req.onerror = () => reject(req.error);
	});
	db.close();
	return row;
}

export async function setLastFlashMeta(meta: Record<string, string>): Promise<void> {
	if (typeof indexedDB === 'undefined') return;
	const db = await openDb();
	await new Promise<void>((resolve, reject) => {
		const tx = db.transaction(META, 'readwrite');
		tx.objectStore(META).put(meta, 'lastFlash');
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
	db.close();
}
