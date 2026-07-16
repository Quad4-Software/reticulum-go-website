import type { Tutorial } from '../types';
import { GO_LINK, PY_LINK } from '../samples';

/**
 * Verified against reticulum.network understanding.html (Links)
 * and project links-channels-and-resources docs.
 */
export const linksTutorial: Tutorial = {
	slug: 'links-and-sessions',
	title: 'Links and sessions',
	summary:
		'How encrypted links turn a destination into a reliable session for requests and transfers.',
	tags: ['link', 'session', 'request', 'channel', 'resource'],
	learnLine: 'Open encrypted sessions for requests, channels, and resources.',
	zenNote:
		'A link is not a server login. It is a bilateral encrypted session between destinations that already found each other.',
	sources: [
		{
			id: 'manual-links',
			label: 'Reticulum Manual: Links overview',
			href: 'https://reticulum.network/manual/understanding.html'
		},
		{
			id: 'go-links',
			label: 'Reticulum-Go: Links, channels, and resources',
			href: '/docs/links-channels-and-resources'
		},
		{
			id: 'go-api-link',
			label: 'Reticulum-Go: API reference (link recipes)',
			href: '/docs/api-reference'
		}
	],
	steps: [
		{
			id: 'why-links',
			title: 'Why open a link',
			body: 'Single packets are enough for simple messages. Links add a cheap encrypted channel with forward secrecy, RTT tracking, keepalives, and helpers for requests, channels, buffers, and file resources.',
			points: [
				'Link setup costs only a few packets once a path exists',
				'Initiator anonymity still applies for the described link modes',
				'Resources and channels ride on top of an established link'
			],
			visual: 'link-lifecycle',
			visualFocus: 0
		},
		{
			id: 'lifecycle',
			title: 'Link lifecycle',
			body: 'Establishment follows LINKREQUEST, identification, then LINKREADY. Either side can close. Project docs also note hop expectation checks aligned with RNS 1.3.8.',
			points: [
				'Outbound links need a known destination hash and usually a path table entry',
				'Inbound requests are handled by transport and link packages',
				'Auto-reconnect helpers exist in Go when enabled on the node'
			],
			visual: 'link-lifecycle',
			visualFocus: 2,
			interactive: 'link-sim',
			tryIt: 'Play the link simulator. Data only works after LINKREADY. Close ends the session.',
			code: {
				caption: 'Open an outbound link once you know the peer',
				python: PY_LINK,
				go: GO_LINK,
				pythonRequires: ['RNS.Link', 'Identity.recall'],
				goRequires: ['link.NewLink', 'Establish', 'quad4/reticulum-go'],
				practiceLinks: [
					{ label: 'Links docs', href: '/docs/links-channels-and-resources' },
					{ label: 'Try WASM Demo', href: '/wasm-example' }
				]
			}
		},
		{
			id: 'requests-resources',
			title: 'Requests, channels, and resources',
			body: 'On a ready link you can register request handlers, exchange channel messages, stream buffers, or send multi-part resources. These are application patterns built on the same encrypted session.',
			points: [
				'Request and response carry structured replies with timeouts',
				'Channels give ordered reliable messages inside the link',
				'Resources move larger payloads with hashing, proofs, and optional compression'
			],
			visual: 'link-lifecycle',
			visualFocus: 2,
			interactive: 'resource-path',
			tryIt:
				'Step from LINKREADY through request, channel, buffer, and resource. Each layer still needs the link.'
		}
	]
};
