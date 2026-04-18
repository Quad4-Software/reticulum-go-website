import { browser } from '$app/environment';
import { SvelteMap } from 'svelte/reactivity';
import { loadWasmExec } from './wasm-exec-loader';
import {
	loadIdentity,
	saveIdentity,
	type Identity,
	saveAutoAnnounce,
	loadAutoAnnounce
} from './identity';
import { db } from './db';
import { WASM_CACHE_KEY } from './wasm-version';

async function waitFor(predicate: () => boolean, timeoutMs: number) {
	if (predicate()) return;
	const start = Date.now();
	while (!predicate()) {
		if (Date.now() - start > timeoutMs) {
			throw new Error('timed out waiting for WASM to initialise');
		}
		await new Promise((r) => setTimeout(r, 16));
	}
}

export interface Peer {
	hash: string;
	name: string;
	hops: number;
	lastSeen: Date;
}

export interface ChatMessage {
	text: string;
	from: string;
	hash: string;
	time: Date;
	type: 'sent' | 'received';
}

export interface ReticulumStats {
	packetsSent: number;
	packetsReceived: number;
	bytesSent: number;
	bytesReceived: number;
	announcesSent: number;
	announcesReceived: number;
}

interface ReticulumWasm {
	init: (
		wsUrl: string,
		userName: string,
		privateKey: string
	) => {
		error?: string;
		identity: string;
		destination: string;
		privateKey: string;
	};
	connect: () => { error?: string };
	disconnect: () => { error?: string };
	announce: (name: string) => { error?: string };
	sendMessage: (peerHash: string, data: string | Uint8Array) => { error?: string };
	requestPath: (peerHash: string) => { error?: string };
	getStats: () => ReticulumStats;
	isConnected: () => boolean;
}

declare global {
	interface Window {
		reticulum?: ReticulumWasm;
		Go: {
			new (): {
				importObject: WebAssembly.Imports;
				run: (instance: WebAssembly.Instance) => Promise<void>;
			};
		};
		onPeerDiscovered: (peer: { hash: string; appData: string; hops: number }) => void;
		onChatMessage: (msg: { from: string; text: string }) => void;
		log: (msg: string, type?: string) => void;
	}
}

export type KeyStatus = 'known' | 'unknown' | 'fetching';

class ReticulumService {
	initialized = $state(false);
	connected = $state(false);
	isLoading = $state(false);
	error = $state<string | null>(null);
	identity = $state<Identity | null>(null);
	peers = new SvelteMap<string, Peer>();
	messages = new SvelteMap<string, ChatMessage[]>();
	unreadCounts = new SvelteMap<string, number>();
	peerKeyStatus = new SvelteMap<string, KeyStatus>();
	selectedPeerHash = $state('');
	stats = $state<ReticulumStats>({
		packetsSent: 0,
		packetsReceived: 0,
		bytesSent: 0,
		bytesReceived: 0,
		announcesSent: 0,
		announcesReceived: 0
	});
	logs = $state<{ msg: string; type: string; time: string }[]>([]);
	autoAnnounce = $state(false);
	notificationsEnabled = $state(false);

	private wasmLoadingPromise: Promise<void> | null = null;
	private announceInterval: number | null = null;
	private statsInterval: number | null = null;
	private legacyDbChecked = false;

	constructor() {
		if (browser) {
			this.setupCallbacks();
			this.setupVisibilityHandler();
			this.checkNotificationPermission();
		}
	}

	private checkNotificationPermission() {
		if (typeof Notification !== 'undefined') {
			this.notificationsEnabled = Notification.permission === 'granted';
		}
	}

	async requestNotificationPermission() {
		if (typeof Notification === 'undefined') return;

		const permission = await Notification.requestPermission();
		this.notificationsEnabled = permission === 'granted';
		if (this.notificationsEnabled) {
			this.log('Browser notifications enabled', 'success');
		}
		return permission;
	}

	private setupVisibilityHandler() {
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible' && this.initialized) {
				// Refresh status immediately when coming back
				this.refreshStatus();
			}
		});
	}

	private refreshStatus() {
		if (window.reticulum && this.initialized) {
			this.connected = window.reticulum.isConnected();
			const s = window.reticulum.getStats();
			this.stats = {
				packetsSent: s.packetsSent,
				packetsReceived: s.packetsReceived,
				bytesSent: s.bytesSent,
				bytesReceived: s.bytesReceived,
				announcesSent: s.announcesSent,
				announcesReceived: s.announcesReceived
			};
		}
	}

	async ensureWasmLoaded() {
		if (!browser || this.initialized || window.reticulum) return;

		// Check for WebAssembly support
		if (typeof WebAssembly === 'undefined') {
			this.error = 'WebAssembly is not supported in this browser';
			this.log(this.error, 'error');
			return;
		}

		if (this.wasmLoadingPromise) return this.wasmLoadingPromise;

		if (!this.legacyDbChecked) {
			this.legacyDbChecked = true;
			try {
				// Remove legacy DB name that can conflict with older WASM schema versions.
				if (typeof indexedDB !== 'undefined') {
					indexedDB.deleteDatabase('reticulum_wasm_db');
				}
			} catch {
				// Ignore cleanup errors; WASM load will continue.
			}
		}

		this.isLoading = true;
		this.error = null;
		this.wasmLoadingPromise = this.loadWasm().finally(() => {
			this.isLoading = false;
		});
		return this.wasmLoadingPromise;
	}

	private setupCallbacks() {
		window.onPeerDiscovered = (peerData) => {
			console.debug('[reticulum] onPeerDiscovered', peerData);

			if (!peerData || typeof peerData.hash !== 'string') {
				console.warn('[reticulum] dropping malformed peer payload', peerData);
				return;
			}

			if (this.identity && peerData.hash === this.identity.publicKey) {
				return;
			}

			const peerName = peerData.appData || `Peer ${peerData.hash.substring(0, 8)}`;
			const existing = this.peers.has(peerData.hash);

			if (!existing && this.peers.size >= 500) {
				let oldestHash: string | null = null;
				let oldestTime = Infinity;

				for (const [hash, p] of this.peers.entries()) {
					if (p.lastSeen.getTime() < oldestTime) {
						oldestTime = p.lastSeen.getTime();
						oldestHash = hash;
					}
				}

				if (oldestHash) {
					this.peers.delete(oldestHash);
				}
			}

			const peer: Peer = {
				hash: peerData.hash,
				name: peerName,
				hops: peerData.hops,
				lastSeen: new Date()
			};

			this.peers.set(peerData.hash, peer);
			db.savePeer(peer).catch(console.error);

			if (!existing) {
				this.log(`Discovered peer: ${peerName}`, 'success');
			}
			this.peerKeyStatus.set(peerData.hash, 'known');
		};

		window.onChatMessage = (msg) => {
			console.log('Received message:', msg);
			const peerHash = msg.from || 'unknown';

			// Ensure peer exists even if not announced
			if (!this.peers.has(peerHash)) {
				const newPeer: Peer = {
					hash: peerHash,
					name: peerHash === 'unknown' ? 'Unknown Sender' : `Peer ${peerHash.substring(0, 8)}`,
					hops: 0,
					lastSeen: new Date()
				};
				this.peers.set(peerHash, newPeer);
				db.savePeer(newPeer).catch(console.error);
				this.log(
					`Received message from ${peerHash === 'unknown' ? 'unknown sender' : 'new peer: ' + peerHash.substring(0, 8)}`,
					'info'
				);
			}

			const peer = this.peers.get(peerHash);
			const peerName = peer ? peer.name : 'Unknown';

			const message: ChatMessage = {
				text: msg.text,
				from: peerName,
				hash: peerHash,
				time: new Date(),
				type: 'received'
			};

			const history = this.messages.get(peerHash) || [];
			this.messages.set(peerHash, [...history, message]);
			db.saveMessage(peerHash, message).catch(console.error);

			if (peerHash !== this.selectedPeerHash) {
				const currentCount = this.unreadCounts.get(peerHash) || 0;
				this.unreadCounts.set(peerHash, currentCount + 1);
			}

			this.peerKeyStatus.set(peerHash, 'known');
			this.log(`New message from ${peerName}`, 'info');

			// Browser Notification
			if (
				this.notificationsEnabled &&
				(document.visibilityState === 'hidden' || peerHash !== this.selectedPeerHash)
			) {
				new Notification(`New message from ${peerName}`, {
					body: msg.text.length > 100 ? msg.text.substring(0, 97) + '...' : msg.text,
					icon: '/logo.svg'
				});
			}
		};

		window.log = (msg: string, type: string = 'info') => {
			this.log(msg, type);
		};
	}

	private log(msg: string, type: string) {
		const time = new Date().toLocaleTimeString();
		this.logs = [...this.logs.slice(-99), { msg, type, time }];
	}

	private async loadWasm() {
		if (!browser) return;

		try {
			await loadWasmExec();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : String(e);
			this.error = message;
			this.log(message, 'error');
			return;
		}

		if (typeof window.Go === 'undefined') {
			this.error = 'Go WASM runtime (wasm_exec.js) not found';
			return;
		}

		const go = new window.Go();
		try {
			// Cache-bust the wasm binary so the SW (or HTTP cache) cannot
			// pin an old build alongside a new app shell.
			const wasmUrl = `/reticulum-go.wasm?v=${WASM_CACHE_KEY}`;
			const response = await fetch(wasmUrl, { cache: 'no-cache' });
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

			const result = await WebAssembly.instantiateStreaming(response, go.importObject);
			go.run(result.instance);

			// go.run starts the Go program asynchronously; window.reticulum
			// is only installed once main() reaches RegisterJSFunctions.
			// Wait for that, otherwise the very next call into the API
			// will explode with "Reticulum WASM not loaded".
			await waitFor(() => Boolean(window.reticulum), 5000);
			this.log('Reticulum-Go loaded', 'success');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			this.error = `Failed to load WASM: ${message}`;
			this.log(this.error, 'error');
			throw err;
		}
	}

	async init(wsUrl: string, userName: string) {
		await this.ensureWasmLoaded();
		if (!window.reticulum) {
			throw new Error('Reticulum WASM not loaded');
		}

		// Register callbacks BEFORE handing control to WASM init() so the
		// transport cannot fire an announce or packet between init() and
		// the callback registration (which happened in the old code path
		// and silently dropped the very first batch of announces).
		this.registerWasmCallbacks();

		const saved = await loadIdentity();
		const result = window.reticulum.init(wsUrl, userName, saved?.privateKey || '');

		if (result.error) {
			throw new Error(result.error);
		}

		const newIdentity: Identity = {
			address: result.identity,
			publicKey: result.destination,
			privateKey: result.privateKey,
			createdAt: Date.now()
		};

		await saveIdentity(newIdentity);
		this.identity = newIdentity;
		this.initialized = true;

		try {
			const savedPeers = await db.getAllPeers();
			for (const peer of savedPeers) {
				this.peers.set(peer.hash, peer);
				const peerMessages = await db.getMessages(peer.hash);
				if (peerMessages.length > 0) {
					this.messages.set(peer.hash, peerMessages);
				}
			}
			this.log(`Loaded ${savedPeers.length} peers from storage`, 'info');
		} catch (e) {
			console.error('Failed to load data from DB:', e);
		}

		try {
			const autoEnabled = await loadAutoAnnounce();
			if (autoEnabled) {
				this.toggleAutoAnnounce(true, userName);
			}
		} catch (e) {
			console.error('Failed to load auto-announce setting:', e);
		}

		this.log('Reticulum initialized', 'success');
		return result;
	}

	private registerWasmCallbacks() {
		const api = window.reticulum as
			| (ReticulumWasm & {
					setAnnounceCallback?: (
						cb: (data: { hash: string; appData: string; hops: number }) => void
					) => void;
					setPacketCallback?: (cb: (data: Uint8Array) => void) => void;
			  })
			| undefined;
		if (!api) return;

		if (typeof api.setAnnounceCallback === 'function') {
			api.setAnnounceCallback((peerData) => {
				try {
					window.onPeerDiscovered(peerData);
				} catch (e) {
					console.error('onPeerDiscovered threw:', e, peerData);
				}
			});
		} else {
			console.warn('reticulum.setAnnounceCallback is missing; rebuild the WASM');
		}

		if (typeof api.setPacketCallback === 'function') {
			api.setPacketCallback((data: Uint8Array) => {
				try {
					if (data.length >= 16) {
						const senderHash = Array.from(data.slice(0, 16))
							.map((b) => b.toString(16).padStart(2, '0'))
							.join('');
						const text = new TextDecoder().decode(data.slice(16));
						window.onChatMessage({ from: senderHash, text });
					}
				} catch (e) {
					console.error('Failed to parse incoming packet:', e);
				}
			});
		} else {
			console.warn('reticulum.setPacketCallback is missing; rebuild the WASM');
		}
	}

	async connect() {
		await this.ensureWasmLoaded();
		if (!window.reticulum) return;
		const result = window.reticulum.connect();
		if (result.error) {
			this.log(`Connection failed: ${result.error}`, 'error');
			return;
		}
		this.connected = true;
		this.log('Connected to network', 'success');

		this.startStatsLoop();
	}

	async disconnect() {
		if (!window.reticulum) return;
		window.reticulum.disconnect();
		this.connected = false;
		if (this.autoAnnounce) {
			this.toggleAutoAnnounce(false, '');
		}
		this.log('Disconnected', 'info');
	}

	async announce(name: string) {
		if (!window.reticulum) return;
		const result = window.reticulum.announce(name);
		if (result.error) {
			this.log(`Announce failed: ${result.error}`, 'error');
		} else {
			this.log('Announce sent', 'success');
		}
	}

	toggleAutoAnnounce(enabled: boolean, name: string) {
		this.autoAnnounce = enabled;
		saveAutoAnnounce(enabled).catch(console.error);

		if (this.announceInterval) {
			clearInterval(this.announceInterval);
			this.announceInterval = null;
		}

		if (enabled) {
			this.log('Auto-announce enabled (every 15 minutes)', 'info');
			// Initial announce
			this.announce(name);
			// 15 minutes interval
			this.announceInterval = setInterval(
				() => {
					if (this.connected) {
						this.announce(name);
					}
				},
				15 * 60 * 1000
			) as unknown as number;
		} else {
			this.log('Auto-announce disabled', 'info');
		}
	}

	async sendMessage(peerHash: string, text: string) {
		if (!window.reticulum) return;

		// We need to prepend our own hash so the receiver knows who we are
		// In Reticulum, the destination hash is 16 bytes.
		// Since we don't have a full identity exchange protocol here,
		// we use this simple [16 bytes sender hash][text] format.
		const senderHashHex = this.identity?.address;
		if (!senderHashHex) throw new Error('Identity not loaded');

		const senderBytes = new Uint8Array(
			senderHashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
		);
		const textBytes = new TextEncoder().encode(text);
		const combined = new Uint8Array(senderBytes.length + textBytes.length);
		combined.set(senderBytes);
		combined.set(textBytes, senderBytes.length);

		const result = window.reticulum.sendMessage(peerHash, combined);
		if (result.error) {
			const errorMsg = result.error.toLowerCase();
			if (
				errorMsg.includes('identity not found') ||
				errorMsg.includes('unknown') ||
				errorMsg.includes('key')
			) {
				this.peerKeyStatus.set(peerHash, 'unknown');
			}
			this.log(`Send failed: ${result.error}`, 'error');
			throw new Error(result.error);
		}

		this.peerKeyStatus.set(peerHash, 'known');
		const message: ChatMessage = {
			text,
			from: 'Me',
			hash: peerHash,
			time: new Date(),
			type: 'sent'
		};

		const history = this.messages.get(peerHash) || [];
		this.messages.set(peerHash, [...history, message]);
		db.saveMessage(peerHash, message).catch(console.error);
	}

	async fetchKeys(peerHash: string) {
		if (!window.reticulum) return;

		this.peerKeyStatus.set(peerHash, 'fetching');
		this.log(`Requesting keys for ${peerHash.substring(0, 8)}...`, 'info');

		const result = window.reticulum.requestPath(peerHash);
		if (result.error) {
			this.peerKeyStatus.set(peerHash, 'unknown');
			this.log(`Key request failed: ${result.error}`, 'error');
			throw new Error(result.error);
		}

		// The peer status will be updated to 'known' automatically
		// when an announce is received via onPeerDiscovered
	}

	private startStatsLoop() {
		if (this.statsInterval) return;
		this.statsInterval = setInterval(() => {
			this.refreshStatus();
		}, 1000) as unknown as number;
	}

	async resetAppData() {
		if (!browser) return;

		// Clear IndexedDB
		const dbs = await window.indexedDB.databases();
		dbs.forEach((db) => {
			if (db.name) window.indexedDB.deleteDatabase(db.name);
		});

		// Clear LocalStorage
		localStorage.clear();

		// Reload page
		window.location.reload();
	}
}

export const reticulum = new ReticulumService();
