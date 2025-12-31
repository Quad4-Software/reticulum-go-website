import { browser } from '$app/environment';
import { SvelteMap } from 'svelte/reactivity';
import {
	loadIdentity,
	saveIdentity,
	type Identity,
	saveAutoAnnounce,
	loadAutoAnnounce
} from './identity';

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
	sendMessage: (peerHash: string, text: string) => { error?: string };
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

class ReticulumService {
	initialized = $state(false);
	connected = $state(false);
	isLoading = $state(false);
	error = $state<string | null>(null);
	identity = $state<Identity | null>(null);
	peers = new SvelteMap<string, Peer>();
	messages = new SvelteMap<string, ChatMessage[]>();
	unreadCounts = new SvelteMap<string, number>();
	selectedPeerHash = $state('');
	stats = $state<ReticulumStats>({
		packetsSent: 0,
		packetsReceived: 0,
		bytesSent: 0,
		bytesReceived: 0
	});
	logs = $state<{ msg: string; type: string; time: string }[]>([]);
	autoAnnounce = $state(false);

	private wasmLoadingPromise: Promise<void> | null = null;
	private announceInterval: number | null = null;

	constructor() {
		if (browser) {
			this.setupCallbacks();
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

		this.isLoading = true;
		this.error = null;
		this.wasmLoadingPromise = this.loadWasm().finally(() => {
			this.isLoading = false;
		});
		return this.wasmLoadingPromise;
	}

	private setupCallbacks() {
		window.onPeerDiscovered = (peer) => {
			// Skip our own announcements
			if (this.identity && peer.hash === this.identity.publicKey) {
				return;
			}

			const peerName = peer.appData || `Peer ${peer.hash.substring(0, 8)}`;
			const existing = this.peers.has(peer.hash);

			// Limit to 500 peers, remove oldest if exceeded
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

			this.peers.set(peer.hash, {
				hash: peer.hash,
				name: peerName,
				hops: peer.hops,
				lastSeen: new Date()
			});

			if (!existing) {
				this.log(`Discovered peer: ${peerName}`, 'success');
			}
		};

		window.onChatMessage = (msg) => {
			console.log('Received message:', msg);
			const peerHash = msg.from || 'unknown';

			// Ensure peer exists even if not announced
			if (!this.peers.has(peerHash)) {
				this.peers.set(peerHash, {
					hash: peerHash,
					name: peerHash === 'unknown' ? 'Unknown Sender' : `Peer ${peerHash.substring(0, 8)}`,
					hops: 0,
					lastSeen: new Date()
				});
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

			if (peerHash !== this.selectedPeerHash) {
				const currentCount = this.unreadCounts.get(peerHash) || 0;
				this.unreadCounts.set(peerHash, currentCount + 1);
			}

			this.log(`New message from ${peerName}`, 'info');
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
		if (typeof window.Go === 'undefined') {
			this.error = 'Go WASM runtime (wasm_exec.js) not found';
			return;
		}

		const go = new window.Go();
		try {
			// Try to get SRI hash from manifest
			let integrity: string | undefined;
			try {
				const manifestRes = await fetch('/sri-manifest.json');
				if (manifestRes.ok) {
					const manifest = await manifestRes.json();
					integrity = manifest['/reticulum-go.wasm'];
				}
			} catch (e) {
				console.warn('Failed to load SRI manifest, proceeding without SRI:', e);
			}

			// integrity is part of RequestInit, but crossorigin is crossOrigin
			const fetchOptions: RequestInit = integrity ? { integrity, mode: 'cors' } : {};
			const response = await fetch('/reticulum-go.wasm', fetchOptions);
			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

			const result = await WebAssembly.instantiateStreaming(response, go.importObject);
			go.run(result.instance);
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

		// Load auto-announce setting
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
		const result = window.reticulum.sendMessage(peerHash, text);
		if (result.error) {
			this.log(`Send failed: ${result.error}`, 'error');
			throw new Error(result.error);
		}

		const message: ChatMessage = {
			text,
			from: 'Me',
			hash: peerHash,
			time: new Date(),
			type: 'sent'
		};

		const history = this.messages.get(peerHash) || [];
		this.messages.set(peerHash, [...history, message]);
	}

	private startStatsLoop() {
		setInterval(() => {
			if (window.reticulum && this.initialized) {
				const s = window.reticulum.getStats();
				this.stats = {
					packetsSent: s.packetsSent,
					packetsReceived: s.packetsReceived,
					bytesSent: s.bytesSent,
					bytesReceived: s.bytesReceived
				};
				this.connected = window.reticulum.isConnected();
			}
		}, 1000);
	}
}

export const reticulum = new ReticulumService();
