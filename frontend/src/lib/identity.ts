const DB_NAME = 'reticulum_wasm_db';
const STORE_NAME = 'identity';
const SETTINGS_STORE = 'settings';
const IDENTITY_KEY = 'current_identity';
const AUTO_ANNOUNCE_KEY = 'auto_announce';

export interface Identity {
	address: string;
	publicKey: string;
	privateKey: string;
	createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 2);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
			if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
				db.createObjectStore(SETTINGS_STORE);
			}
		};

		request.onsuccess = (event) => {
			resolve((event.target as IDBOpenDBRequest).result);
		};

		request.onerror = (event) => {
			reject((event.target as IDBOpenDBRequest).error);
		};
	});
}

export async function saveIdentity(identity: Identity): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(identity, IDENTITY_KEY);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function loadIdentity(): Promise<Identity | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get(IDENTITY_KEY);

		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

export async function clearIdentity(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.delete(IDENTITY_KEY);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function saveAutoAnnounce(enabled: boolean): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(SETTINGS_STORE, 'readwrite');
		const store = transaction.objectStore(SETTINGS_STORE);
		const request = store.put(enabled, AUTO_ANNOUNCE_KEY);

		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

export async function loadAutoAnnounce(): Promise<boolean> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(SETTINGS_STORE, 'readonly');
		const store = transaction.objectStore(SETTINGS_STORE);
		const request = store.get(AUTO_ANNOUNCE_KEY);

		request.onsuccess = () => resolve(request.result === true);
		request.onerror = () => reject(request.error);
	});
}
