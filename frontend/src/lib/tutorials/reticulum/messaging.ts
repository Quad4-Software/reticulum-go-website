import type { Tutorial } from '../types';

/**
 * Application messaging on Reticulum.
 * LXMF and companion apps live outside this repo. This chapter maps the stack
 * they sit on (identity, announce, path, encrypted delivery).
 */
export const messagingTutorial: Tutorial = {
	slug: 'messaging-and-lxmf',
	title: 'Messaging and LXMF',
	summary:
		'How chat-style apps sit on Reticulum destinations, announces, paths, and encrypted delivery.',
	tags: ['lxmf', 'messaging', 'chat', 'applications'],
	learnLine: 'Connect Reticulum primitives to app-layer messaging like LXMF.',
	zenNote:
		'Reticulum delivers encrypted packets to destinations. Message formats, mailboxes, and UIs belong to applications.',
	sources: [
		{
			id: 'manual-understanding',
			label: 'Reticulum Manual: Understanding Reticulum',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-architecture',
			label: 'Reticulum-Go: Architecture (application protocols)',
			href: '/docs/architecture'
		},
		{
			id: 'go-links',
			label: 'Reticulum-Go: Links, channels, and resources',
			href: '/docs/links-channels-and-resources'
		}
	],
	steps: [
		{
			id: 'reticulum-vs-app',
			title: 'Stack versus application',
			body: 'Reticulum provides identities, destinations, announces, packets, and links. LXMF and similar messengers define message fields, delivery semantics, and user interfaces on top. Reticulum-Go does not embed LXMF. Companion projects do.',
			points: [
				'Keep transport concerns in Reticulum packages',
				'Keep message schema and mailbox logic in the app layer',
				'Ren Chat and LXMFy-Go are examples of that split in the Ren ecosystem'
			],
			visual: 'messaging-flow',
			visualFocus: 0
		},
		{
			id: 'delivery-path',
			title: 'What delivery needs',
			body: 'A messenger still needs the same mesh basics: an identity, a destination to receive on, announces so peers learn your hash, a path toward the peer, then an encrypted packet or link payload.',
			points: [
				'SINGLE destinations carry private traffic across hops',
				'Path requests matter before you assume multi-hop delivery',
				'Links help when you need sessions, channels, or larger transfers'
			],
			visual: 'messaging-flow',
			visualFocus: 2,
			interactive: 'lxmf-flow',
			tryIt:
				'Step the messaging flow from identity to app layer. Notice LXMF sits at the end, not inside transport.'
		},
		{
			id: 'try-in-browser',
			title: 'Practice in the browser',
			body: 'The WASM Demo runs Reticulum-Go in the browser over a WebSocket gateway. It is a chat-style exercise of identity, peers, and encrypted messages without installing a daemon first.',
			points: [
				'Use it to feel announce and peer discovery before writing a bot',
				'Production messengers still need honest interface and path planning',
				'Bot Builder and LXMFy-Go target LXMF bots when those tools ship'
			],
			visual: 'messaging-flow',
			visualFocus: 4,
			tryIt:
				'Open the WASM Demo from Apps or the practice link below after you finish this chapter.',
			code: {
				caption: 'Practice delivery in the browser before writing a messenger',
				python: `import RNS

# LXMF and similar apps sit above Reticulum.
# Use identity, destination, announce, then encrypted delivery.
print("See WASM Demo for a browser exercise of peers and messages")
`,
				go: `package main

// LXMF lives in companion projects.
// Reticulum-Go provides identity, destination, announce, packet, and link primitives.
// Try /wasm-example for a browser chat exercise on those primitives.
func main() {}
`,
				pythonRequires: ['RNS'],
				goRequires: ['package main'],
				practiceLinks: [
					{ label: 'Try WASM Demo', href: '/wasm-example' },
					{ label: 'Architecture docs', href: '/docs/architecture' }
				]
			}
		}
	]
};
