import { browser } from '$app/environment';
import { SvelteMap } from 'svelte/reactivity';
import { loadIdentity, saveIdentity, type Identity } from './identity';

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
	selectedPeerHash = $state('');
	stats = $state<ReticulumStats>({
		packetsSent: 0,
		packetsReceived: 0,
		bytesSent: 0,
		bytesReceived: 0
	});
	logs = $state<{ msg: string; type: string; time: string }[]>([]);

	private wasmLoadingPromise: Promise<void> | null = null;

	constructor() {
		if (browser) {
			this.setupCallbacks();
		}
	}

	async ensureWasmLoaded() {
		if (!browser || this.initialized || window.reticulum) return;
		if (this.wasmLoadingPromise) return this.wasmLoadingPromise;

		this.wasmLoadingPromise = this.loadWasm();
		return this.wasmLoadingPromise;
	}

	private setupCallbacks() {
		window.onPeerDiscovered = (peer) => {
			const peerName = peer.appData || `Peer ${peer.hash.substring(0, 8)}`;
			const existing = this.peers.has(peer.hash);

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
			const peerHash = msg.from || this.selectedPeerHash || 'unknown';
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

			if (peerName === 'Unknown') {
				this.log(`Received packet from ${peerHash.substring(0, 8)}...`, 'info');
			} else {
				this.log(`New message from ${peerName}`, 'info');
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
		if (typeof window.Go === 'undefined') return;

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
			this.log(`Failed to load WASM: ${message}`, 'error');
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
