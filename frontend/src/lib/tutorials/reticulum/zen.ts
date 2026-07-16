import type { Tutorial } from '../types';
import { GO_MINIMAL, PY_MINIMAL } from '../samples';

/**
 * Verified against reticulum.network/manual/understanding.html (Motivation, Goals).
 */
export const zenTutorial: Tutorial = {
	slug: 'zen-and-goals',
	title: 'Zen and design goals',
	summary:
		'Why Reticulum exists: permissionless networks, medium agnosticism, and encryption by default.',
	tags: ['zen', 'goals', 'motivation'],
	learnLine: 'Why Reticulum exists and how sovereignty shapes the stack.',
	zenNote:
		'Reticulum is a tool to build thousands of networks, not one network with a kill switch.',
	sources: [
		{
			id: 'manual-motivation',
			label: 'Reticulum Manual: Motivation',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'manual-goals',
			label: 'Reticulum Manual: Goals',
			href: 'https://reticulum.network/manual/understanding.html#goals'
		}
	],
	steps: [
		{
			id: 'motivation',
			title: 'Motivation',
			body: 'Reticulum targets reliable, secure communication without large amounts of coordination or centralised trust. Joining should not require gatekeepers.',
			points: [
				'Built for long-range and minimal-infrastructure digital communication',
				'Aims to reduce central control, censorship leverage, and barrier to entry',
				'Medium agnostic: radio, serial, Ethernet, WiFi, LoRa, and other digital carriers'
			],
			visual: 'zen-pillars'
		},
		{
			id: 'goals',
			title: 'Guiding goals',
			body: 'Official goals include open-source usability, hardware agnosticism, very low bandwidth operation, encryption by default, initiator anonymity, and unlicensed mediums where possible.',
			points: [
				'Open source stack required for availability, security, and transparency',
				'Target reliability over links as slow as about 5 bits per second',
				'Encryption by default for communication',
				'Destinations and identities instead of classical address-and-port models'
			],
			visual: 'zen-pillars',
			code: {
				caption: 'Same first announce in Python RNS and Reticulum-Go',
				python: PY_MINIMAL,
				go: GO_MINIMAL,
				pythonRequires: ['RNS.Reticulum', 'RNS.Identity', 'RNS.Destination', '.announce()'],
				goRequires: [
					'quad4/reticulum-go/pkg/destination',
					'identity.New',
					'destination.New',
					'Announce'
				],
				practiceLinks: [
					{ label: 'Try WASM Demo', href: '/wasm-example' },
					{ label: 'API reference', href: '/docs/api-reference' }
				]
			},
			tryIt:
				'Flip between Python and Go. Both create an identity, a single destination, and send an announce.'
		},
		{
			id: 'sovereignty',
			title: 'Networks for people',
			body: 'The aim is that anyone can be their own network operator, covering areas with independent, interconnectable networks that need no central oversight.',
			points: [
				'Reticulum is not one network. It is a tool to build many networks',
				'Networks that can associate and disassociate freely',
				'Low deployment cost using off-the-shelf hardware where possible'
			],
			visual: 'zen-pillars'
		},
		{
			id: 'first-build',
			title: 'A practical first build',
			body: 'Start with one identity, one SINGLE destination, one announce, then one peer path. Add a link only when you need requests, channels, or resources. Keep the carrier honest with the Interfaces chapter before promising radio support.',
			points: [
				'Announce first so peers can learn your hash and public key',
				'Request a path before you try an outbound link',
				'Persist the identity file so restarts keep the same self'
			],
			visual: 'packet-path'
		}
	]
};
