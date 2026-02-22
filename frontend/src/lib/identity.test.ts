import { describe, it, expect } from 'vitest';
import {
	saveIdentity,
	loadIdentity,
	clearIdentity,
	saveAutoAnnounce,
	loadAutoAnnounce,
	type Identity
} from './identity';

describe('identity', () => {
	const mockIdentity: Identity = {
		address: 'addr123',
		publicKey: 'pub456',
		privateKey: 'priv789',
		createdAt: Date.now()
	};

	it('returns null when no identity stored', async () => {
		const loaded = await loadIdentity();
		expect(loaded).toBeNull();
	});

	it('saves and loads identity', async () => {
		await saveIdentity(mockIdentity);
		const loaded = await loadIdentity();
		expect(loaded).toEqual(mockIdentity);
	});

	it('clears identity', async () => {
		await saveIdentity(mockIdentity);
		await clearIdentity();
		const loaded = await loadIdentity();
		expect(loaded).toBeNull();
	});

	it('saves and loads auto-announce setting', async () => {
		expect(await loadAutoAnnounce()).toBe(false);
		await saveAutoAnnounce(true);
		expect(await loadAutoAnnounce()).toBe(true);
		await saveAutoAnnounce(false);
		expect(await loadAutoAnnounce()).toBe(false);
	});
});
