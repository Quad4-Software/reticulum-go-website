import type { Tutorial } from '../types';
import { GO_PATH, PY_PATH } from '../samples';

/**
 * Verified against reticulum.network understanding.html (transport)
 * and frontend transport.md (HandlePacket, PATHFINDER_M unpack rejection).
 */
export const packetsTutorial: Tutorial = {
	slug: 'packets-and-hops',
	title: 'Packets across hops',
	summary: 'How encrypted packets move hop by hop, and why plain traffic stays local.',
	tags: ['packets', 'transport', 'hops'],
	zenNote: 'Trust the cryptography and the next hop, not a central map of the whole network.',
	sources: [
		{
			id: 'manual-transport',
			label: 'Reticulum Manual: Transport',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-transport-packets',
			label: 'Reticulum-Go: Transport',
			href: '/docs/transport'
		},
		{
			id: 'go-security-hops',
			label: 'Reticulum-Go: Security (PATHFINDER_M)',
			href: '/docs/security'
		}
	],
	steps: [
		{
			id: 'ingress',
			title: 'From interface to transport',
			body: 'Interfaces deliver frames into the transport engine. Packets are unpacked, hop limits enforced, and types dispatched (data, announce, link, path request, and related).',
			points: [
				'Hop counts at or above PATHFINDER_M (128) are rejected at unpack in Go docs for RNS 1.3.8 parity',
				'Transport can also drop announces or relays that would exceed MaxHops after increment',
				'Blackholed identity announces are dropped when blackhole entries exist'
			],
			visual: 'packet-path',
			interactive: 'packet-sim',
			tryIt:
				'Run the packet simulator. Switch Encrypted versus Plain, then step hops until delivery or PATHFINDER_M drop.'
		},
		{
			id: 'forward',
			title: 'Forwarding without full routes',
			body: 'When acting as a relay, a transport node moves a packet one hop closer using its path table. No participant needs a complete end-to-end route view.',
			points: [
				'Path table entries come from announces and path responses',
				'Data may be rewrapped with header type 2 when transport ID matches (Python relay semantics)',
				'Encrypted single-destination traffic can traverse multiple hops. Plain destination packets do not'
			],
			visual: 'packet-path',
			interactive: 'hop-limit',
			tryIt:
				'Drag the hop byte toward 128. At 128 and above the packet is rejected at unpack, matching RNS 1.3.8.',
			code: {
				caption: 'Request a path before you try to send',
				python: PY_PATH,
				go: GO_PATH,
				pythonRequires: ['request_path'],
				goRequires: ['RequestPath', 'quad4/reticulum-go']
			}
		},
		{
			id: 'delivery',
			title: 'Local delivery',
			body: 'When a packet reaches a node that holds a matching destination, transport delivers it to registered application destinations and link handlers as appropriate.',
			points: [
				'Applications register destinations to receive data',
				'Links terminate into link-table sessions on the correct instance',
				'Reliability features (proofs, resources) build on this transport base'
			],
			visual: 'packet-path'
		},
		{
			id: 'debug-checklist',
			title: 'When packets go nowhere',
			body: 'Most quiet failures are local. Confirm the peer announced, confirm you have a path table entry, confirm the destination type allows multi-hop, and confirm the hop byte is still below PATHFINDER_M.',
			points: [
				'No announce usually means no public key and no path',
				'PLAIN destinations will never leave the local broadcast domain',
				'Links need a known destination hash and a ready path before Establish'
			],
			visual: 'packet-path',
			tryIt: 'Use the hop slider again, then open Links and sessions for the Establish path.'
		}
	]
};
