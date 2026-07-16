import type { Tutorial } from '../types';

/**
 * Verified against reticulum.network hardware / interfaces chapters
 * and project interfaces + compatibility docs (what Go implements today).
 */
export const interfacesTutorial: Tutorial = {
	slug: 'interfaces-and-carriers',
	title: 'Interfaces and carriers',
	summary:
		'Reticulum rides any digital carrier. Learn what that means and what Reticulum-Go supports today.',
	tags: ['interfaces', 'hardware', 'lora', 'tcp', 'websocket'],
	zenNote:
		'The interface is the medium. Radio, serial, fiber, or WebSocket are just ways bytes move. The stack stays the same.',
	sources: [
		{
			id: 'manual-hardware',
			label: 'Reticulum Manual: Communications hardware',
			href: 'https://reticulum.network/manual/hardware.html'
		},
		{
			id: 'manual-interfaces',
			label: 'Reticulum Manual: Configuring interfaces',
			href: 'https://reticulum.network/manual/interfaces.html'
		},
		{
			id: 'go-interfaces',
			label: 'Reticulum-Go: Interfaces',
			href: '/docs/interfaces'
		},
		{
			id: 'go-compat',
			label: 'Reticulum-Go: Compatibility',
			href: '/docs/compatibility'
		}
	],
	steps: [
		{
			id: 'medium-agnostic',
			title: 'Medium agnostic by design',
			body: 'Official goals include hardware agnosticism and operation over links as slow as about 5 bits per second with a 500-byte MTU mindset. If it can carry a digital stream, it can often carry Reticulum.',
			points: [
				'One mesh can mix LoRa, packet radio, Ethernet, WiFi, and internet tunnels',
				'Transport learns paths from announces across heterogeneous interfaces',
				'IFAC can segment who may join a logical interface community'
			],
			visual: 'interfaces-mesh'
		},
		{
			id: 'pick-carrier',
			title: 'Pick a carrier honestly',
			body: 'Reticulum-Go already speaks several IP-oriented interfaces. Radio serial drivers such as RNode are still Python-side in the reference. Do not invent support that Compatibility says is missing.',
			points: [
				'Available in Go docs today: UDP, TCP client/server, Auto, I2P, Backbone, WebSocket paths',
				'Not in this Go tree yet: RNode, Serial, KISS, AX.25 KISS, Weave',
				'Browser WASM demos typically use WebSocket gateways'
			],
			visual: 'interfaces-mesh',
			interactive: 'interface-pick',
			tryIt:
				'Tap RNode versus TCP. See which path this Go implementation can run today without pretending.'
		},
		{
			id: 'mix-strategies',
			title: 'Mix strategies',
			body: 'A common pattern is a mountain LoRa site bridged over TCP or Backbone to a city mesh. Reticulum treats that as one fabric of destinations, not as NAT hell.',
			points: [
				'Transport nodes only know next hops, so bridges do not need a global map',
				'Announce rate limits keep slow radios usable',
				'Prefer verified Compatibility notes before promising hardware support in apps'
			],
			visual: 'packet-path'
		}
	]
};
