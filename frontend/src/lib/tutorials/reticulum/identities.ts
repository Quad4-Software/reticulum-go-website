import type { Tutorial } from '../types';
import { GO_IDENTITY, PY_IDENTITY } from '../samples';

/**
 * Verified against reticulum.network understanding.html (Identities)
 * and project identity / cryptography docs.
 */
export const identitiesTutorial: Tutorial = {
	slug: 'identities-and-keys',
	title: 'Identities and keys',
	summary: 'How a Reticulum identity becomes a portable cryptographic self you can take offline.',
	tags: ['identity', 'keys', 'x25519', 'ed25519'],
	zenNote:
		'Your address is who you are, not where you are. Move the device. Keep the identity file. Peers still find you.',
	sources: [
		{
			id: 'manual-identities',
			label: 'Reticulum Manual: Identities',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-identity-docs',
			label: 'Reticulum-Go: Identity and destinations',
			href: '/docs/identity-and-destinations'
		},
		{
			id: 'go-crypto',
			label: 'Reticulum-Go: Cryptography',
			href: '/docs/cryptography'
		}
	],
	steps: [
		{
			id: 'what-is-identity',
			title: 'An identity is a keyset',
			body: 'A Reticulum identity holds Curve25519 material used for encryption (X25519) and signing (Ed25519). Applications build destinations from identities. Peers learn public material from announces.',
			points: [
				'Identity keys are the long-term foundation for destinations and links',
				'Private material must stay on the device that owns the identity',
				'Public material is what announces share so others can encrypt to you'
			],
			visual: 'crypto-stack',
			code: {
				caption: 'Create and persist an identity',
				python: PY_IDENTITY,
				go: GO_IDENTITY,
				pythonRequires: ['RNS.Identity', 'to_file', 'from_file'],
				goRequires: ['quad4/reticulum-go/pkg/identity', 'identity.New', 'ToFile', 'FromFile']
			},
			tryIt: 'Flip to Go and back. Both examples write an identity file so a restart keeps the same cryptographic self.'
		},
		{
			id: 'portable-self',
			title: 'Portable existence',
			body: 'Because destinations derive from identity material, you can move between WiFi, LoRa, or a ferry radio link without changing who you are on the mesh. That is the Zen of nomadism.',
			points: [
				'Destination hashes stay stable while the underlying carrier changes',
				'Fresh announces update reachability after you roam',
				'Losing the private identity file loses the ability to prove you are that self'
			],
			visual: 'zen-pillars'
		},
		{
			id: 'recall-and-trust',
			title: 'Recalling peers',
			body: 'When you have seen a peer announce, you can recall their public identity from the local store and build an outbound destination. Trust still comes from cryptography and your own threat model, not from a central directory.',
			points: [
				'Identity.recall (Python) and identity.Recall (Go) load known public material',
				'Unknown keys can be requested via path mechanisms after an announce',
				'Never invent peer keys. Wait for signed announces or another verified channel'
			],
			visual: 'announce-flood'
		}
	]
};
