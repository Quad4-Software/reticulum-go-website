export interface DocEntry {
	slug: string;
	lang: string;
	content: string;
	updatedAt: number;
}

const DB_NAME = 'reticulum-docs';
const DB_VERSION = 1;
const STORE_NAME = 'docs';

export async function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: ['slug', 'lang'] });
			}
		};
	});
}

export async function saveDoc(doc: DocEntry): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readwrite');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.put(doc);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

export async function getDoc(slug: string, lang: string): Promise<DocEntry | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.get([slug, lang]);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result || null);
	});
}

export async function getAllDocsForLang(lang: string): Promise<DocEntry[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.getAll();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const allDocs = request.result as DocEntry[];
			resolve(allDocs.filter((doc) => doc.lang === lang));
		};
	});
}

export async function hasAnyDocs(): Promise<boolean> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(STORE_NAME, 'readonly');
		const store = transaction.objectStore(STORE_NAME);
		const request = store.count();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result > 0);
	});
}
