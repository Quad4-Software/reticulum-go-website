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
	tags: ['packets', 'transport', 'hops', 'wire', 'blackhole'],
	learnLine: 'Forward encrypted packets hop by hop and respect PATHFINDER_M.',
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
		},
		{
			id: 'go-compat-blackhole',
			label: 'Reticulum-Go: Compatibility (blackhole gap)',
			href: '/docs/compatibility'
		}
	],
	steps: [
		{
			id: 'wireframe',
			title: 'Packet wireframe',
			body: 'Every Reticulum packet carries flags, a hop byte, a 16-byte destination hash, context, and payload. Header type 2 also carries a transport ID so relays can rewrap multi-hop data.',
			points: [
				'Header types 1 and 2 are both implemented in Reticulum-Go',
				'Hop byte >= PATHFINDER_M (128) is rejected at unpack',
				'This wireframe is conceptual. Exact packing lives in pkg/packet'
			],
			visual: 'packet-wireframe',
			visualFocus: 0,
			interactive: 'packet-wireframe',
			tryIt:
				'Toggle header type 1 versus 2, then click each field. Notice Transport ID appears only on type 2.'
		},
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
			visualFocus: 0,
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
			visualFocus: 1,
			interactive: 'hop-limit',
			tryIt:
				'Drag the hop byte toward 128. At 128 and above the packet is rejected at unpack, matching RNS 1.3.8.',
			code: {
				caption: 'Request a path before you try to send',
				python: PY_PATH,
				go: GO_PATH,
				pythonRequires: ['request_path'],
				goRequires: ['RequestPath', 'quad4/reticulum-go'],
				practiceLinks: [{ label: 'Transport docs', href: '/docs/transport' }]
			}
		},
		{
			id: 'blackhole',
			title: 'Blackholes',
			body: 'Operators can blackhole an identity hash so its announces are ignored. Reticulum-Go drops blackholed announces. Full link teardown at LINKIDENTIFY for blackholed peers is still a documented gap versus Python 1.3.2.',
			points: [
				'Blackhole entries live in pkg/blackhole and CLI helpers such as rgopath',
				'Announce drop protects path tables from unwanted identities',
				'Check Compatibility when comparing Go and Python blackhole behavior'
			],
			visual: 'packet-path',
			visualFocus: 2,
			interactive: 'blackhole-toggle',
			tryIt:
				'Toggle the blackhole. Watch the announce flip between accepted and dropped, and read the Go gap note.'
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
			visual: 'packet-path',
			visualFocus: 3
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
			visualFocus: 3,
			tryIt: 'Use the hop slider again, then open Links and sessions for the Establish path.'
		}
	]
};
