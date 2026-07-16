/**
 * Pure helpers for tutorial interactives.
 * Numbers and rules match project docs and RNS 1.3.8 parity notes.
 */

/** PATHFINDER_M / MaxHops default from Reticulum-Go transport docs. */
export const PATHFINDER_M = 128;

export type DestinationKind = 'single' | 'plain' | 'group' | 'link';

export type DestinationRule = {
	kind: DestinationKind;
	label: string;
	encrypted: boolean;
	multiHop: boolean;
	detail: string;
};

export const DESTINATION_RULES: Record<DestinationKind, DestinationRule> = {
	single: {
		kind: 'single',
		label: 'Single',
		encrypted: true,
		multiHop: true,
		detail:
			'Addressed to a unique public key. Payload is encrypted for that key holder and can travel multiple hops.'
	},
	plain: {
		kind: 'plain',
		label: 'Plain',
		encrypted: false,
		multiHop: false,
		detail:
			'Unencrypted local broadcast. The protocol does not transport plain destination packets over multiple hops.'
	},
	group: {
		kind: 'group',
		label: 'Group',
		encrypted: true,
		multiHop: false,
		detail:
			'Symmetric-key encryption for a group. Current protocol does not multi-hop group destinations (upstream notes a planned upgrade).'
	},
	link: {
		kind: 'link',
		label: 'Link',
		encrypted: true,
		multiHop: true,
		detail:
			'An established encrypted channel to a single destination with reliability helpers and forward secrecy.'
	}
};

export type HopOutcome = {
	hops: number;
	accepted: boolean;
	reason: string;
};

/**
 * Models the RNS 1.3.8 unpack rule: hop counts >= PATHFINDER_M are rejected.
 */
export function evaluateHopLimit(hops: number): HopOutcome {
	const value = Math.max(0, Math.min(255, Math.floor(hops)));
	if (value >= PATHFINDER_M) {
		return {
			hops: value,
			accepted: false,
			reason: `Rejected at unpack. Hop byte ${value} is >= PATHFINDER_M (${PATHFINDER_M}).`
		};
	}
	return {
		hops: value,
		accepted: true,
		reason: `Accepted for further transport handling. Hop byte ${value} is below PATHFINDER_M (${PATHFINDER_M}).`
	};
}

export type CryptoStage = {
	id: string;
	label: string;
	detail: string;
};

export const CRYPTO_PIPELINE: CryptoStage[] = [
	{
		id: 'ephemeral',
		label: 'Ephemeral X25519',
		detail: 'Sender creates a one-time X25519 keypair for this packet or token.'
	},
	{
		id: 'ecdh',
		label: 'ECDH',
		detail: 'Shared secret from ephemeral private key and peer encryption public key.'
	},
	{
		id: 'hkdf',
		label: 'HKDF-SHA256',
		detail: 'Expands the shared secret into an HMAC key, then an AES key.'
	},
	{
		id: 'aes',
		label: 'AES-256-CBC',
		detail: 'Encrypts the payload with PKCS#7 padding where the reference uses CBC.'
	},
	{
		id: 'hmac',
		label: 'HMAC-SHA256',
		detail: 'Authenticates the ciphertext. Receivers verify HMAC before decrypt.'
	}
];

export type AnnounceSimFrame = {
	hop: number;
	action: string;
};

/**
 * Tiny announce flood story for the interactive replay.
 */
export function buildAnnounceReplay(maxShown = 4): AnnounceSimFrame[] {
	const frames: AnnounceSimFrame[] = [
		{ hop: 0, action: 'Origin signs announce (hash, public key, optional app data, random blob).' },
		{
			hop: 1,
			action: 'Neighbor records next-hop and hop count, then schedules a delayed retransmit.'
		},
		{ hop: 2, action: 'Further nodes ignore exact duplicates already seen.' },
		{
			hop: 3,
			action: `Flood stops after the hop budget (default m = ${PATHFINDER_M}) is exhausted.`
		}
	];
	return frames.slice(0, Math.max(1, maxShown));
}

export type LinkStage = {
	id: string;
	label: string;
	detail: string;
};

export const LINK_STAGES: LinkStage[] = [
	{
		id: 'linkrequest',
		label: 'LINKREQUEST',
		detail: 'Initiator asks to open an encrypted session toward a known single destination.'
	},
	{
		id: 'linkidentify',
		label: 'LINKIDENTIFY',
		detail: 'Peers exchange identity material for the session. Hop expectations are checked.'
	},
	{
		id: 'linkready',
		label: 'LINKREADY',
		detail: 'The link is active. You can send data, requests, channels, or resources.'
	},
	{
		id: 'linkclose',
		label: 'LINKCLOSE',
		detail: 'Either side tears the session down cleanly when finished or on failure.'
	}
];

export type InterfaceKind = 'lora' | 'tcp' | 'udp' | 'serial' | 'websocket';

export type InterfaceCard = {
	kind: InterfaceKind;
	label: string;
	inGo: boolean;
	detail: string;
};

export const INTERFACE_CARDS: Record<InterfaceKind, InterfaceCard> = {
	lora: {
		kind: 'lora',
		label: 'RNode / LoRa',
		inGo: false,
		detail:
			'Classic low-bandwidth radio path via RNode firmware. Not implemented in Reticulum-Go yet. Use Python RNS or wait for tiny-reticulum-go / flasher work.'
	},
	tcp: {
		kind: 'tcp',
		label: 'TCP',
		inGo: true,
		detail: 'TCP client and server interfaces are available in Reticulum-Go for IP backhaul.'
	},
	udp: {
		kind: 'udp',
		label: 'UDP',
		inGo: true,
		detail: 'UDP interfaces are available for LAN and internet UDP carriers.'
	},
	serial: {
		kind: 'serial',
		label: 'Serial / KISS',
		inGo: false,
		detail: 'Serial and KISS modem paths are in the Python reference. Not in this Go tree yet.'
	},
	websocket: {
		kind: 'websocket',
		label: 'WebSocket',
		inGo: true,
		detail: 'WebSocket carriers support browser WASM clients and gateway bridges.'
	}
};

export type PacketSimNode = {
	id: string;
	label: string;
};

export const PACKET_SIM_NODES: PacketSimNode[] = [
	{ id: 'a', label: 'A' },
	{ id: 'b', label: 'B' },
	{ id: 'c', label: 'C' },
	{ id: 'd', label: 'D' }
];

export type PacketSimMode = 'encrypted' | 'plain';

export type PacketSimState = {
	nodeIndex: number;
	hops: number;
	status: 'moving' | 'delivered' | 'dropped' | 'local-only';
	detail: string;
};

/**
 * Advances a packet one hop. Encrypted multi-hop traffic can traverse the path.
 * Plain traffic stays on the first interface (local only).
 * Hop bytes at or above PATHFINDER_M are rejected.
 */
export function stepPacketSim(
	mode: PacketSimMode,
	nodeIndex: number,
	hops: number
): PacketSimState {
	if (mode === 'plain') {
		if (nodeIndex === 0) {
			return {
				nodeIndex: 0,
				hops: 0,
				status: 'local-only',
				detail: 'PLAIN destinations are not transported over multiple hops. Delivery stays local.'
			};
		}
		return {
			nodeIndex: 0,
			hops: 0,
			status: 'local-only',
			detail: 'PLAIN destinations are not transported over multiple hops. Delivery stays local.'
		};
	}

	if (hops >= PATHFINDER_M) {
		return {
			nodeIndex,
			hops,
			status: 'dropped',
			detail: `Rejected at unpack. Hop byte ${hops} is >= PATHFINDER_M (${PATHFINDER_M}).`
		};
	}

	const last = PACKET_SIM_NODES.length - 1;
	if (nodeIndex >= last) {
		return {
			nodeIndex: last,
			hops,
			status: 'delivered',
			detail: 'Local delivery. The destination node holds a matching SINGLE destination.'
		};
	}

	const nextIndex = nodeIndex + 1;
	const nextHops = hops + 1;
	if (nextHops >= PATHFINDER_M) {
		return {
			nodeIndex,
			hops: nextHops,
			status: 'dropped',
			detail: `Relay aborted. Incremented hop ${nextHops} would hit PATHFINDER_M (${PATHFINDER_M}).`
		};
	}

	return {
		nodeIndex: nextIndex,
		hops: nextHops,
		status: nextIndex >= last ? 'delivered' : 'moving',
		detail:
			nextIndex >= last
				? 'Arrived at destination after multi-hop forward.'
				: `Forwarded toward next hop. Path table only needs the neighbor, not the full route.`
	};
}

export type LinkSimFrame = {
	id: string;
	label: string;
	from: 'A' | 'B' | 'both';
	detail: string;
	canSendData: boolean;
};

export const LINK_SIM_FRAMES: LinkSimFrame[] = [
	{
		id: 'idle',
		label: 'Idle',
		from: 'both',
		detail: 'Peers know destination hashes. No session yet.',
		canSendData: false
	},
	{
		id: 'linkrequest',
		label: 'LINKREQUEST',
		from: 'A',
		detail: 'A asks B to open an encrypted link toward B\'s SINGLE destination.',
		canSendData: false
	},
	{
		id: 'linkidentify',
		label: 'LINKIDENTIFY',
		from: 'both',
		detail: 'Identity material is exchanged. Hop expectations are checked.',
		canSendData: false
	},
	{
		id: 'linkready',
		label: 'LINKREADY',
		from: 'both',
		detail: 'Session is active. Requests, channels, and resources can flow.',
		canSendData: true
	},
	{
		id: 'data',
		label: 'DATA',
		from: 'A',
		detail: 'Application payload rides the ready link with forward secrecy.',
		canSendData: true
	},
	{
		id: 'linkclose',
		label: 'LINKCLOSE',
		from: 'B',
		detail: 'Either side tears the session down. Further data needs a new Establish.',
		canSendData: false
	}
];
