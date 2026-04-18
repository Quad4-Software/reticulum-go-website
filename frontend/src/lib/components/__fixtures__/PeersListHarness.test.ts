import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import { tick } from 'svelte';

const fakeDbState = {
	peers: new Map<string, { hash: string; name: string; hops: number; lastSeen: Date }>(),
	messages: new Map<
		string,
		Array<{ text: string; from: string; hash: string; time: Date; type: 'sent' | 'received' }>
	>()
};

vi.mock('$lib/db', () => ({
	db: {
		savePeer: vi.fn(async (peer) => {
			fakeDbState.peers.set(peer.hash, peer);
		}),
		getAllPeers: vi.fn(async () => Array.from(fakeDbState.peers.values())),
		saveMessage: vi.fn(async () => {}),
		getMessages: vi.fn(async () => [])
	}
}));

let fakeStoredIdentity: import('$lib/identity').Identity | null = null;

vi.mock('$lib/identity', () => ({
	loadIdentity: vi.fn(async () => fakeStoredIdentity),
	saveIdentity: vi.fn(async (identity) => {
		fakeStoredIdentity = identity;
	}),
	clearIdentity: vi.fn(async () => {
		fakeStoredIdentity = null;
	}),
	loadAutoAnnounce: vi.fn(async () => false),
	saveAutoAnnounce: vi.fn(async () => {})
}));

import PeersListHarness from './PeersListHarness.svelte';

interface MockReticulumApi {
	init: ReturnType<typeof vi.fn>;
	connect: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
	announce: ReturnType<typeof vi.fn>;
	sendMessage: ReturnType<typeof vi.fn>;
	requestPath: ReturnType<typeof vi.fn>;
	getStats: ReturnType<typeof vi.fn>;
	isConnected: ReturnType<typeof vi.fn>;
	setAnnounceCallback: ReturnType<typeof vi.fn>;
	setPacketCallback: ReturnType<typeof vi.fn>;
}

function buildMockApi(): MockReticulumApi {
	return {
		init: vi.fn(() => ({
			identity: 'identity-hash',
			destination: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			privateKey: 'priv',
			success: true
		})),
		connect: vi.fn(() => ({ success: true })),
		disconnect: vi.fn(() => ({ success: true })),
		announce: vi.fn(() => ({ success: true })),
		sendMessage: vi.fn(() => ({ success: true })),
		requestPath: vi.fn(() => ({ success: true })),
		getStats: vi.fn(() => ({
			packetsSent: 0,
			packetsReceived: 0,
			bytesSent: 0,
			bytesReceived: 0,
			announcesSent: 0,
			announcesReceived: 0
		})),
		isConnected: vi.fn(() => true),
		setAnnounceCallback: vi.fn(),
		setPacketCallback: vi.fn()
	};
}

describe('PeersListHarness – UI reactivity to onPeerDiscovered', () => {
	let api: MockReticulumApi;

	beforeEach(() => {
		fakeDbState.peers.clear();
		fakeDbState.messages.clear();
		fakeStoredIdentity = null;
		api = buildMockApi();
		(window as unknown as { reticulum: MockReticulumApi }).reticulum = api;
	});

	afterEach(() => {
		cleanup();
		delete (window as unknown as { reticulum?: MockReticulumApi }).reticulum;
	});

	it('shows the peers section once init() resolves (proves the {#if reticulum.initialized} gate)', async () => {
		const { reticulum } = await import('$lib/reticulum.svelte');
		reticulum.peers.clear();
		reticulum.peersVersion = 0;
		reticulum.initialized = false;
		reticulum.identity = null;

		const { getByTestId, queryByTestId } = render(PeersListHarness);

		expect(getByTestId('not-initialized')).toBeTruthy();

		await reticulum.init('wss://example/ws', 'tester');
		await tick();

		expect(queryByTestId('not-initialized')).toBeNull();
		expect(getByTestId('peers-section')).toBeTruthy();
		expect(getByTestId('empty')).toBeTruthy();
	});

	it('re-renders the list when an announce arrives via window.onPeerDiscovered', async () => {
		const { reticulum } = await import('$lib/reticulum.svelte');
		reticulum.peers.clear();
		reticulum.peersVersion = 0;
		reticulum.initialized = false;
		reticulum.identity = null;

		const { getByTestId, queryByTestId, queryAllByTestId } = render(PeersListHarness);

		await reticulum.init('wss://example/ws', 'tester');
		await tick();

		expect(queryAllByTestId('peer-row')).toHaveLength(0);

		window.onPeerDiscovered({
			hash: '182340b8339f3c5f7a5c48ef2efdbbce',
			appData: 'Ivan2',
			hops: 1
		});
		await tick();

		expect(queryByTestId('empty')).toBeNull();
		const rows = queryAllByTestId('peer-row');
		expect(rows).toHaveLength(1);
		expect(rows[0].getAttribute('data-hash')).toBe('182340b8339f3c5f7a5c48ef2efdbbce');
		expect(rows[0].textContent).toBe('Ivan2');

		window.onPeerDiscovered({
			hash: 'cccccccccccccccccccccccccccccccc',
			appData: 'Mallory',
			hops: 2
		});
		await tick();

		expect(queryAllByTestId('peer-row')).toHaveLength(2);
		expect(getByTestId('peers-section')).toBeTruthy();
	});
});
