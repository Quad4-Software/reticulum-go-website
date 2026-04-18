import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

/** In-memory DB: the real module keeps a singleton IDB connection across tests. */
const fakeDbState = {
	peers: new Map<string, { hash: string; name: string; hops: number; lastSeen: Date }>(),
	messages: new Map<
		string,
		Array<{ text: string; from: string; hash: string; time: Date; type: 'sent' | 'received' }>
	>()
};

vi.mock('./db', () => ({
	db: {
		savePeer: vi.fn(async (peer) => {
			fakeDbState.peers.set(peer.hash, peer);
		}),
		getAllPeers: vi.fn(async () => Array.from(fakeDbState.peers.values())),
		saveMessage: vi.fn(async (peerHash, message) => {
			const list = fakeDbState.messages.get(peerHash) ?? [];
			list.push(message);
			fakeDbState.messages.set(peerHash, list);
		}),
		getMessages: vi.fn(async (peerHash) => fakeDbState.messages.get(peerHash) ?? [])
	}
}));

/** In-memory identity so `init()` does not reuse state from earlier tests. */
let fakeStoredIdentity: import('./identity').Identity | null = null;
let fakeAutoAnnounce = false;

vi.mock('./identity', () => ({
	loadIdentity: vi.fn(async () => fakeStoredIdentity),
	saveIdentity: vi.fn(async (identity) => {
		fakeStoredIdentity = identity;
	}),
	clearIdentity: vi.fn(async () => {
		fakeStoredIdentity = null;
	}),
	loadAutoAnnounce: vi.fn(async () => fakeAutoAnnounce),
	saveAutoAnnounce: vi.fn(async (enabled: boolean) => {
		fakeAutoAnnounce = enabled;
	})
}));

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
			destination: '5da70cd69e05ba0fbcaf8c0688429530',
			privateKey: 'priv-key',
			success: true
		})),
		connect: vi.fn(() => ({ success: true, interface: 'wasm0' })),
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

describe('reticulum service – peer discovery wiring', () => {
	let api: MockReticulumApi;

	/** `reticulum` is a module singleton; tests reset its fields instead of re-importing. */
	let reticulumModule: typeof import('./reticulum.svelte');

	beforeEach(async () => {
		fakeDbState.peers.clear();
		fakeDbState.messages.clear();
		fakeStoredIdentity = null;
		fakeAutoAnnounce = false;

		api = buildMockApi();
		(window as unknown as { reticulum: MockReticulumApi }).reticulum = api;

		reticulumModule = await import('./reticulum.svelte');
		const r = reticulumModule.reticulum;
		r.peers.clear();
		r.messages.clear();
		r.unreadCounts.clear();
		r.peerKeyStatus.clear();
		r.peersVersion = 0;
		r.messagesVersion = 0;
		r.unreadCountsVersion = 0;
		r.peerKeyStatusVersion = 0;
		r.connected = false;
		r.initialized = false;
		r.identity = null;
		expect(r.peers.size).toBe(0);
	});

	afterEach(() => {
		delete (window as unknown as { reticulum?: MockReticulumApi }).reticulum;
		api.init.mockClear();
		api.connect.mockClear();
		api.setAnnounceCallback.mockClear();
		api.setPacketCallback.mockClear();
	});

	it('registers the announce callback BEFORE init so the first announce cannot be missed', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		expect(api.setAnnounceCallback).toHaveBeenCalledTimes(1);
		expect(api.setPacketCallback).toHaveBeenCalledTimes(1);

		const setAnnounceOrder = api.setAnnounceCallback.mock.invocationCallOrder[0];
		const initOrder = api.init.mock.invocationCallOrder[0];
		expect(setAnnounceOrder).toBeLessThan(initOrder);
	});

	it('adds discovered peers to the reactive peers map', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		expect(typeof window.onPeerDiscovered).toBe('function');

		window.onPeerDiscovered({
			hash: '182340b8339f3c5f7a5c48ef2efdbbce',
			appData: 'Ivan2',
			hops: 1
		});

		flushSync();

		expect(reticulum.peers.size).toBe(1);
		const peer = reticulum.peers.get('182340b8339f3c5f7a5c48ef2efdbbce');
		expect(peer?.name).toBe('Ivan2');
		expect(peer?.hops).toBe(1);
	});

	it('skips announces for our own destination hash', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		expect(reticulum.identity?.publicKey).toBe('5da70cd69e05ba0fbcaf8c0688429530');

		window.onPeerDiscovered({
			hash: '5da70cd69e05ba0fbcaf8c0688429530',
			appData: 'tester',
			hops: 0
		});

		flushSync();

		expect(reticulum.peers.size).toBe(0);
	});

	it('drops malformed announce payloads instead of throwing', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		expect(() =>
			window.onPeerDiscovered(
				undefined as unknown as { hash: string; appData: string; hops: number }
			)
		).not.toThrow();
		expect(reticulum.peers.size).toBe(0);
	});

	it('marks connected=true once init+connect succeed without any UI clicks', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');
		await reticulum.connect();

		flushSync();

		expect(reticulum.connected).toBe(true);
	});

	it('flips connected=true from init() alone, without requiring a separate connect() click', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		expect(api.isConnected).toHaveBeenCalled();
		expect(reticulum.connected).toBe(true);
	});

	it('refreshStatus mirrors live IsConnected changes from the WASM side', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		api.isConnected.mockReturnValue(false);
		reticulum.refreshStatus();
		expect(reticulum.connected).toBe(false);

		api.isConnected.mockReturnValue(true);
		reticulum.refreshStatus();
		expect(reticulum.connected).toBe(true);
	});

	it('forwards announce payloads through the registered WASM callback', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const wasmCallback = api.setAnnounceCallback.mock.calls[0]?.[0];
		expect(typeof wasmCallback).toBe('function');

		wasmCallback?.({
			hash: 'abcd1234abcd1234abcd1234abcd1234',
			appData: 'RemotePeer',
			hops: 2
		});

		flushSync();

		expect(reticulum.peers.get('abcd1234abcd1234abcd1234abcd1234')?.name).toBe('RemotePeer');
	});

	it('optimistically appends outgoing messages so the user sees what they sent', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const peerHash = 'fcff5e64a3ea4edad1d03093fc8fe07f';
		reticulum.peers.set(peerHash, {
			hash: peerHash,
			name: 'Buddy',
			hops: 0,
			lastSeen: new Date()
		});

		await reticulum.sendMessage(peerHash, 'hello world');

		flushSync();

		const history = reticulum.messages.get(peerHash);
		expect(history?.length).toBe(1);
		expect(history?.[0].text).toBe('hello world');
		expect(history?.[0].type).toBe('sent');
		expect(api.sendMessage).toHaveBeenCalledTimes(1);
	});

	it('bumps peersVersion + peerKeyStatusVersion on every announce so $derived UI re-renders', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const before = {
			peers: reticulum.peersVersion,
			peerKeyStatus: reticulum.peerKeyStatusVersion
		};

		const wasmCallback = api.setAnnounceCallback.mock.calls[0]?.[0];
		wasmCallback?.({
			hash: '7777777777777777aaaaaaaaaaaaaaaa',
			appData: 'BumpTest',
			hops: 1
		});

		flushSync();

		expect(reticulum.peersVersion).toBeGreaterThan(before.peers);
		expect(reticulum.peerKeyStatusVersion).toBeGreaterThan(before.peerKeyStatus);
	});

	it('bumps messagesVersion when an outgoing message is buffered', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const peerHash = 'fcff5e64a3ea4edad1d03093fc8fe07f';
		reticulum.peers.set(peerHash, {
			hash: peerHash,
			name: 'Buddy',
			hops: 0,
			lastSeen: new Date()
		});

		const before = reticulum.messagesVersion;
		await reticulum.sendMessage(peerHash, 'ping');
		flushSync();

		expect(reticulum.messagesVersion).toBeGreaterThan(before);
	});

	it('bumps messagesVersion on incoming chat packets so the chat re-renders', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const wasmAnnounce = api.setAnnounceCallback.mock.calls[0]?.[0];
		const wasmPacket = api.setPacketCallback.mock.calls[0]?.[0];
		expect(typeof wasmPacket).toBe('function');

		wasmAnnounce?.({
			hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
			appData: 'Pen',
			hops: 1
		});

		flushSync();
		const beforeMessages = reticulum.messagesVersion;

		const senderBytes = Uint8Array.from(
			'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'.match(/.{2}/g)!.map((b) => parseInt(b, 16))
		);
		const textBytes = new TextEncoder().encode('hello back');
		const combined = new Uint8Array(senderBytes.length + textBytes.length);
		combined.set(senderBytes);
		combined.set(textBytes, senderBytes.length);

		wasmPacket?.(combined);
		flushSync();

		expect(reticulum.messagesVersion).toBeGreaterThan(beforeMessages);
		const history = reticulum.messages.get('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
		expect(history?.length).toBe(1);
		expect(history?.[0].text).toBe('hello back');
	});

	it('embeds our destination hash (not identity hash) as the sender token in outgoing packets', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const peerHash = 'fcff5e64a3ea4edad1d03093fc8fe07f';
		reticulum.peers.set(peerHash, {
			hash: peerHash,
			name: 'Buddy',
			hops: 0,
			lastSeen: new Date()
		});

		await reticulum.sendMessage(peerHash, 'reachable');

		expect(api.sendMessage).toHaveBeenCalledTimes(1);
		const [destArg, payload] = api.sendMessage.mock.calls[0] as [string, Uint8Array];
		expect(destArg).toBe(peerHash);

		const senderHex = Array.from(payload.slice(0, 16))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		expect(senderHex).toBe(reticulum.identity?.publicKey);
		expect(senderHex).not.toBe(reticulum.identity?.address);

		expect(new TextDecoder().decode(payload.slice(16))).toBe('reachable');
	});

	it('still shows the outgoing bubble when WASM rejects the send (e.g. unknown identity)', async () => {
		const { reticulum } = reticulumModule;

		await reticulum.init('wss://example/ws', 'tester');

		const peerHash = '1111111111111111aaaaaaaaaaaaaaaa';
		api.sendMessage.mockReturnValueOnce({ error: 'Identity not found.' });

		await expect(reticulum.sendMessage(peerHash, 'queued')).rejects.toThrow(
			/Identity not found/
		);

		flushSync();

		const history = reticulum.messages.get(peerHash);
		expect(history?.length).toBe(1);
		expect(history?.[0].text).toBe('queued');
		expect(history?.[0].type).toBe('sent');
		expect(reticulum.peerKeyStatus.get(peerHash)).toBe('unknown');
	});
});
