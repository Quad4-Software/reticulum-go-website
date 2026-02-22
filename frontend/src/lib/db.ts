import { browser } from '$app/environment';
import type { Peer, ChatMessage } from './reticulum.svelte';

const DB_NAME = 'reticulum_wasm_db';
const DB_VERSION = 4;

export interface DBPeer {
	hash: string;
	name: string;
	hops: number;
	lastSeen: number; // Store as timestamp for indexedDB
}

export interface DBDoc {
	slug: string;
	lang: string;
	content: string;
	updatedAt: number;
}

export interface DBMessage {
	id?: number;
	peerHash: string;
	text: string;
	from: string;
	time: number; // Store as timestamp
	type: 'sent' | 'received';
}

class ReticulumDB {
	private db: IDBDatabase | null = null;

	private async getDB(): Promise<IDBDatabase> {
		if (this.db) return this.db;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				this.db = request.result;
				resolve(request.result);
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Peers store
				if (!db.objectStoreNames.contains('peers')) {
					db.createObjectStore('peers', { keyPath: 'hash' });
				}

				// Messages store
				if (!db.objectStoreNames.contains('messages')) {
					const messageStore = db.createObjectStore('messages', {
						keyPath: 'id',
						autoIncrement: true
					});
					messageStore.createIndex('peerHash', 'peerHash', { unique: false });
				}

				// Docs store
				if (!db.objectStoreNames.contains('docs')) {
					const docStore = db.createObjectStore('docs', {
						keyPath: ['slug', 'lang']
					});
					docStore.createIndex('lang', 'lang', { unique: false });
				}
			};
		});
	}

	async savePeer(peer: Peer) {
		if (!browser) return;
		const db = await this.getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['peers'], 'readwrite');
			const store = transaction.objectStore('peers');
			const request = store.put({
				hash: peer.hash,
				name: peer.name,
				hops: peer.hops,
				lastSeen: peer.lastSeen.getTime()
			});

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getAllPeers(): Promise<Peer[]> {
		if (!browser) return [];
		const db = await this.getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['peers'], 'readonly');
			const store = transaction.objectStore('peers');
			const request = store.getAll();

			request.onsuccess = () => {
				const dbPeers = request.result as DBPeer[];
				resolve(
					dbPeers.map((p) => ({
						hash: p.hash,
						name: p.name,
						hops: p.hops,
						lastSeen: new Date(p.lastSeen)
					}))
				);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async saveMessage(peerHash: string, message: ChatMessage) {
		if (!browser) return;
		const db = await this.getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['messages'], 'readwrite');
			const store = transaction.objectStore('messages');
			const request = store.add({
				peerHash: peerHash,
				text: message.text,
				from: message.from,
				time: message.time.getTime(),
				type: message.type
			});

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getMessages(peerHash: string): Promise<ChatMessage[]> {
		if (!browser) return [];
		const db = await this.getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['messages'], 'readonly');
			const store = transaction.objectStore('messages');
			const index = store.index('peerHash');
			const request = index.getAll(peerHash);

			request.onsuccess = () => {
				const dbMessages = request.result as DBMessage[];
				resolve(
					dbMessages.map((m) => ({
						text: m.text,
						from: m.from,
						hash: m.peerHash,
						time: new Date(m.time),
						type: m.type
					}))
				);
			};
			request.onerror = () => reject(request.error);
		});
	}

	async saveDoc(doc: DBDoc) {
		if (!browser) return;
		const db = await this.getDB();
		return new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(['docs'], 'readwrite');
			const store = transaction.objectStore('docs');
			const request = store.put(doc);
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	async getDoc(slug: string, lang: string): Promise<DBDoc | null> {
		if (!browser) return null;
		const db = await this.getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['docs'], 'readonly');
			const store = transaction.objectStore('docs');
			const request = store.get([slug, lang]);
			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject(request.error);
		});
	}

	async getAllDocsForLang(lang: string): Promise<DBDoc[]> {
		if (!browser) return [];
		const db = await this.getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['docs'], 'readonly');
			const store = transaction.objectStore('docs');
			const index = store.index('lang');
			const request = index.getAll(lang);
			request.onsuccess = () => resolve(request.result || []);
			request.onerror = () => reject(request.error);
		});
	}

	async hasAnyDocs(): Promise<boolean> {
		if (!browser) return false;
		const db = await this.getDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(['docs'], 'readonly');
			const store = transaction.objectStore('docs');
			const request = store.count();
			request.onsuccess = () => resolve(request.result > 0);
			request.onerror = () => reject(request.error);
		});
	}
}

export const db = new ReticulumDB();

// Export doc-related functions for docs-service.ts
export const saveDoc = (doc: DBDoc) => db.saveDoc(doc);
export const getDoc = (slug: string, lang: string) => db.getDoc(slug, lang);
export const getAllDocsForLang = (lang: string) => db.getAllDocsForLang(lang);
export const hasAnyDocs = () => db.hasAnyDocs();
