import type { Tutorial } from '../types';
import { GO_MINIMAL, GO_PLAIN, PY_MINIMAL, PY_PLAIN } from '../samples';

/**
 * Verified against reticulum.network understanding.html (Destinations)
 * and project cryptography docs for TRUNCATED_HASHLENGTH.
 */
export const destinationsTutorial: Tutorial = {
	slug: 'destinations',
	title: 'Destinations, not addresses',
	summary: 'How Reticulum names endpoints with 16-byte destination hashes and destination types.',
	tags: ['destinations', 'identity', 'naming'],
	learnLine: 'Name endpoints with destination hashes and destination types.',
	zenNote:
		'Naming is power. Destinations move with you. They are not pinned to a network segment like IP addresses.',
	sources: [
		{
			id: 'manual-destinations',
			label: 'Reticulum Manual: Destinations',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-crypto-hash',
			label: 'Reticulum-Go: Cryptography (TRUNCATED_HASHLENGTH)',
			href: '/docs/cryptography'
		}
	],
	steps: [
		{
			id: 'hash',
			title: '16-byte destination hashes',
			body: 'Every destination is a 16-byte (128-bit) hash shown as 32 hex characters. It comes from truncating a SHA-256 hash of identifying aspects. This size balances address space against packet overhead on low-bandwidth links.',
			points: [
				'Displayed like <13425ec15b621c1d928589718000d814>',
				'Aspect names can be long. The network only carries the hash',
				'TRUNCATED_HASHLENGTH is 128 bits in the Go cryptography reference'
			],
			visual: 'destination-types',
			code: {
				caption: 'Create a SINGLE destination and print its hash',
				python: PY_MINIMAL,
				go: GO_MINIMAL,
				pythonRequires: ['RNS.Destination', 'Destination.SINGLE', 'destination.hash'],
				goRequires: ['destination.Single', 'GetHash']
			}
		},
		{
			id: 'types',
			title: 'Destination types',
			body: 'Reticulum defines single, plain, and group destinations, plus links as a special channel type to a single destination. Try the picker to see what changes.',
			points: [
				'Single: unique public key, encrypted, multi-hop capable',
				'Plain: unencrypted local broadcast, not multi-hop',
				'Group: symmetric-key encryption, not multi-hop in the current protocol',
				'Link: established channel with reliability and forward secrecy'
			],
			visual: 'destination-types',
			interactive: 'destination-type',
			tryIt:
				'Pick Plain versus Single. Plain stays local. Single can ride multiple hops because it is encrypted for a key holder.',
			code: {
				caption: 'Plain destinations intentionally stay local',
				python: PY_PLAIN,
				go: GO_PLAIN,
				pythonRequires: ['Destination.PLAIN'],
				goRequires: ['destination.Plain', 'quad4/reticulum-go']
			}
		},
		{
			id: 'aspects',
			title: 'Aspect naming',
			body: 'Destinations use dotted aspects (application, then further aspects). For single destinations, Reticulum appends the public key before hashing so only the correct key holder is addressed.',
			points: [
				'Example shape: environmentlogger.remotesensor.temperature',
				'Do not put uniquely identifying PII in aspects. Uniqueness comes from the public key',
				'Same aspect names on different identities still produce unique hashes'
			],
			visual: 'destination-types'
		},
		{
			id: 'build-order',
			title: 'Build order that works',
			body: 'Create an identity, then a SINGLE destination with clear aspects, then announce. Only use PLAIN for intentional local broadcast. Reach for GROUP when you already share a symmetric key out of band. Open a link after you know the peer hash and have a path.',
			points: [
				'Wrong destination type is a common multi-hop failure mode',
				'Aspect strings are for humans. Hashes are what the network carries',
				'Next chapters cover identities, announces, and links in that order'
			],
			visual: 'destination-types',
			tryIt: 'After this chapter, open Identities and keys, then Announces and multi-hop paths.'
		}
	]
};
