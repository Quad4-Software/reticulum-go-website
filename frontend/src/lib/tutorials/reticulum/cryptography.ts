import type { Tutorial } from '../types';

/**
 * Verified against reticulum.network understanding.html (encryption overview)
 * and frontend cryptography.md primitive inventory.
 */
export const cryptographyTutorial: Tutorial = {
	slug: 'cryptography',
	title: 'Cryptography by default',
	summary:
		'Primitives and the identity-encryption flow used for private single-destination traffic.',
	tags: ['cryptography', 'x25519', 'ed25519', 'aes'],
	zenNote:
		'Encryption is not a feature bolted on later. To be transportable over multiple hops, information must be encrypted.',
	sources: [
		{
			id: 'manual-encryption',
			label: 'Reticulum Manual: Encryption overview',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-crypto',
			label: 'Reticulum-Go: Cryptography',
			href: '/docs/cryptography'
		},
		{
			id: 'crypto-overview',
			label: 'Reticulum crypto overview',
			href: 'https://reticulum.network/crypto.html'
		}
	],
	steps: [
		{
			id: 'primitives',
			title: 'Primitive inventory',
			body: 'Reticulum-Go matches the Python reference on-wire crypto. The suite is Curve25519-based (X25519 and Ed25519), SHA-256, HKDF-SHA256, AES-256-CBC, and HMAC-SHA256. This is not TLS and not AEAD unless a future coordinated protocol change adds that.',
			points: [
				'X25519 for ECDH, ratchets, and related key agreement',
				'Ed25519 for announce signatures and related authentication',
				'AES-256-CBC with PKCS#7 where the reference uses CBC',
				'HMAC-SHA256 authenticates identity ciphertext before decrypt'
			],
			visual: 'crypto-stack',
			code: {
				caption: 'Both stacks speak the same on-wire crypto vocabulary',
				python: `import RNS

# Identity holds X25519 (encryption) + Ed25519 (signing) material.
identity = RNS.Identity()
print(identity.hash)
`,
				go: `import (
\t"quad4/reticulum-go/pkg/identity"
)

id, err := identity.New()
if err != nil {
\tlog.Fatal(err)
}
_ = id // X25519 + Ed25519 key material inside
`,
				pythonRequires: ['RNS.Identity'],
				goRequires: ['quad4/reticulum-go/pkg/identity', 'identity.New']
			}
		},
		{
			id: 'identity-token',
			title: 'Encrypting to an identity',
			body: 'When encrypting to another identity public X25519 key, Reticulum derives per-packet material with ephemeral ECDH, then encrypts and authenticates the payload. Walk the pipeline to see each stage.',
			points: [
				'Generate an ephemeral X25519 keypair',
				'ECDH with the peer encryption public key (or ratchet public key when used)',
				'HKDF-SHA256 expands the shared secret to HMAC key then AES key',
				'AES-256-CBC encrypt. HMAC-SHA256 over ciphertext. Verify HMAC before decrypt'
			],
			visual: 'crypto-stack',
			interactive: 'crypto-pipeline',
			tryIt:
				'Advance the pipeline. Notice HMAC is checked before AES decrypt. That ordering matches the Go cryptography docs.'
		},
		{
			id: 'links-ratchets',
			title: 'Links and ratchets',
			body: 'A Link is an encrypted channel to a single destination with forward secrecy via ECDH on Curve25519 for per-link ephemeral keys. Asymmetric packet traffic can also use optional X25519 ratchets for forward secrecy on a per-destination basis.',
			points: [
				'Links add reliability APIs (requests, large transfers) on top of encryption',
				'Initiator anonymity is offered for link and single-packet modes described upstream',
				'Plain and current group destinations are not multi-hop. Encryption is part of what enables transport'
			],
			visual: 'crypto-stack'
		},
		{
			id: 'operator-habits',
			title: 'Operator habits that matter',
			body: 'Treat private identity material like a root of trust for your destinations. Prefer encrypted SINGLE traffic for anything that must leave the local interface. Verify peers from signed announces instead of inventing keys.',
			points: [
				'Back up identity files offline if losing them would strand your destination',
				'Do not paste private keys into chat logs or screenshots',
				'HMAC-before-decrypt means corrupted ciphertext fails closed'
			],
			visual: 'crypto-stack'
		}
	]
};
