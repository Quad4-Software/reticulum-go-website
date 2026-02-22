import { describe, it, expect } from 'vitest';
import { db, saveDoc, getDoc, getAllDocsForLang, hasAnyDocs } from './db';
import type { DBDoc } from './db';

describe('db', () => {
	it('hasAnyDocs returns false when empty', async () => {
		expect(await hasAnyDocs()).toBe(false);
	});

	it('getAllDocsForLang returns docs for lang', async () => {
		await saveDoc({
			slug: 'a',
			lang: 'en',
			content: 'A',
			updatedAt: 1
		});
		await saveDoc({
			slug: 'b',
			lang: 'en',
			content: 'B',
			updatedAt: 2
		});
		await saveDoc({
			slug: 'c',
			lang: 'de',
			content: 'C',
			updatedAt: 3
		});
		const enDocs = await getAllDocsForLang('en');
		expect(enDocs).toHaveLength(2);
		expect(enDocs.map((d) => d.slug).sort()).toEqual(['a', 'b']);
		const deDocs = await getAllDocsForLang('de');
		expect(deDocs).toHaveLength(1);
		expect(deDocs[0].slug).toBe('c');
	});

	it('saves and retrieves doc', async () => {
		const doc: DBDoc = {
			slug: 'intro',
			lang: 'en',
			content: '# Hello',
			updatedAt: Date.now()
		};
		await saveDoc(doc);
		const loaded = await getDoc('intro', 'en');
		expect(loaded).toEqual(doc);
	});

	it('returns null for missing doc', async () => {
		expect(await getDoc('nonexistent', 'en')).toBeNull();
	});

	it('hasAnyDocs returns true when docs exist', async () => {
		await saveDoc({
			slug: 'x',
			lang: 'en',
			content: 'X',
			updatedAt: 1
		});
		expect(await hasAnyDocs()).toBe(true);
	});

	it('saves and retrieves peers', async () => {
		await db.savePeer({
			hash: 'h1',
			name: 'Peer1',
			hops: 1,
			lastSeen: new Date(1000)
		});
		const peers = await db.getAllPeers();
		expect(peers).toHaveLength(1);
		expect(peers[0]).toEqual({
			hash: 'h1',
			name: 'Peer1',
			hops: 1,
			lastSeen: new Date(1000)
		});
	});

	it('saves and retrieves messages', async () => {
		await db.saveMessage('peer1', {
			text: 'hi',
			from: 'Me',
			hash: 'peer1',
			time: new Date(2000),
			type: 'sent'
		});
		const msgs = await db.getMessages('peer1');
		expect(msgs).toHaveLength(1);
		expect(msgs[0].text).toBe('hi');
		expect(msgs[0].type).toBe('sent');
	});
});
