import type { Tutorial } from '../types';
import { GO_ANNOUNCE, GO_PATH, PY_ANNOUNCE, PY_PATH } from '../samples';

/**
 * Verified against reticulum.network understanding.html (announces, transport)
 * and frontend transport.md (PATHFINDER_M / MaxHops 128).
 */
export const announcesTutorial: Tutorial = {
	slug: 'announces-and-paths',
	title: 'Announces and multi-hop paths',
	summary: 'How public keys and reachability spread through signed announces, hop by hop.',
	tags: ['announce', 'transport', 'routing', 'discovery'],
	learnLine: 'Spread reachability with signed announces and hop-limited floods.',
	zenNote:
		'No node knows the full path. Each transport node only knows the next hop toward a destination.',
	sources: [
		{
			id: 'manual-announces',
			label: 'Reticulum Manual: Announces and Transport',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-transport',
			label: 'Reticulum-Go: Transport',
			href: '/docs/transport'
		}
	],
	steps: [
		{
			id: 'announce-contents',
			title: 'What an announce carries',
			body: 'An announce is a signed special packet that shares destination hash and public key information so others can build an outgoing destination. Application-specific data may be included. Aspect names are usually omitted to save bandwidth.',
			points: [
				'Destination hash and public key material',
				'Optional application-specific data',
				'A random blob so successive announces are unique',
				'Ed25519 signature over the announce contents'
			],
			visual: 'announce-flood',
			code: {
				caption: 'Send a plain announce, then one with app data',
				python: PY_ANNOUNCE,
				go: GO_ANNOUNCE,
				pythonRequires: ['.announce()', 'app_data='],
				goRequires: ['Announce', 'appData', 'quad4/reticulum-go']
			},
			interactive: 'announce-replay',
			tryIt:
				'Step through the flood. Watch how neighbors learn a next hop without learning a full route map.'
		},
		{
			id: 'propagation',
			title: 'How announces propagate',
			body: 'Transport nodes forward announces with rules: ignore exact duplicates already seen, record who it came from and hop count, stop after m+1 retransmissions (default m is 128), and retransmit after a randomised delay within announce bandwidth budgets.',
			points: [
				'Default maximum hop budget m = 128 (PATHFINDER_M in Go docs)',
				'Announce processing bandwidth is limited per interface (default about 2% upstream)',
				'Closer destinations are prioritised when queues form on slow links',
				'Newer announces with different app data can replace queued older ones'
			],
			visual: 'announce-flood'
		},
		{
			id: 'paths',
			title: 'Paths without a global map',
			body: 'Reticulum transport uses cryptographic path discovery so packets can move closer to a destination without any node knowing the complete route. Destinations may move. A fresh announce updates reachability.',
			points: [
				'Path tables map destination hashes to next-hop information',
				'Unknown public keys can be requested from the network',
				'Announce is optional if keys are shared another verified way, but it is the usual method'
			],
			visual: 'packet-path',
			code: {
				caption: 'Request a path when the local table has no entry',
				python: PY_PATH,
				go: GO_PATH,
				pythonRequires: ['has_path', 'request_path'],
				goRequires: ['HasPath', 'RequestPath', 'quad4/reticulum-go']
			}
		},
		{
			id: 'discovery',
			title: 'Discovery modes and recursive path requests',
			body: 'Unknown-path discovery rebroadcasts a path request when no path is known. That only runs when the receiving interface is in a discover mode (access_point, gateway, roaming, internal) or has recursive_prs = yes (RNS 1.3.6+).',
			points: [
				'Discover modes participate in recursive path help by default',
				'Boundary and similar modes stay quieter unless recursive_prs is enabled',
				'Announce rebroadcast also applies interface mode filters. See Interfaces'
			],
			visual: 'announce-flood',
			visualFocus: 2,
			interactive: 'discovery-modes',
			tryIt:
				'Pick each interface mode. Watch whether unknown-path discovery is allowed, then check recursive_prs.'
		},
		{
			id: 'roaming',
			title: 'Roaming destinations',
			body: 'When a peer moves to another interface or site, a fresh announce updates next-hop information. Applications keep talking to the same destination hash. That is the portable-self model from the Identities chapter.',
			points: [
				'Stale path entries get replaced by newer announce information',
				'Re-announce after major carrier changes so neighbors learn the new next hop',
				'Request path helps when you have a hash but your table is empty'
			],
			visual: 'announce-flood'
		}
	]
};
