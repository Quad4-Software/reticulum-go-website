import { describe, it, expect } from 'vitest';
import { listTutorials, getTutorial, getTutorialSlugs, tutorials } from './index';
import { validateAllTutorials } from './validate';
import {
	PATHFINDER_M,
	DESTINATION_RULES,
	evaluateHopLimit,
	CRYPTO_PIPELINE,
	buildAnnounceReplay,
	LINK_STAGES,
	INTERFACE_CARDS,
	stepPacketSim,
	LINK_SIM_FRAMES,
	IDENTITY_RECALL_STAGES,
	RESOURCE_PATH_STAGES,
	LXMF_FLOW_STAGES,
	PACKET_WIRE_FIELDS,
	blackholeAnnounceOutcome,
	DISCOVERY_MODES
} from './interactive';

describe('tutorial catalog', () => {
	it('exposes a stable ordered set of chapters', () => {
		const slugs = getTutorialSlugs();
		expect(slugs).toEqual([
			'zen-and-goals',
			'destinations',
			'identities-and-keys',
			'announces-and-paths',
			'cryptography',
			'packets-and-hops',
			'links-and-sessions',
			'messaging-and-lxmf',
			'interfaces-and-carriers'
		]);
		expect(listTutorials().map((t) => t.slug)).toEqual(slugs);
		expect(listTutorials().every((t) => t.learnLine.length > 10 && t.stepCount >= 2)).toBe(true);
	});

	it('returns undefined for unknown slugs', () => {
		expect(getTutorial('not-a-real-chapter')).toBeUndefined();
	});

	it('passes structural validation for every chapter', () => {
		const issues = validateAllTutorials(tutorials);
		expect(issues).toEqual([]);
	});

	it('keeps every tutorial citeable and structurally complete', () => {
		for (const tutorial of tutorials) {
			expect(tutorial.title.length).toBeGreaterThan(3);
			expect(tutorial.summary.length).toBeGreaterThan(20);
			expect(tutorial.zenNote.length).toBeGreaterThan(10);
			expect(tutorial.sources.length).toBeGreaterThan(0);
			expect(tutorial.steps.length).toBeGreaterThan(1);

			const sourceIds = new Set<string>();
			for (const source of tutorial.sources) {
				expect(source.id.length).toBeGreaterThan(2);
				expect(sourceIds.has(source.id)).toBe(false);
				sourceIds.add(source.id);
				expect(source.label.length).toBeGreaterThan(3);
				expect(source.href.startsWith('http') || source.href.startsWith('/docs/')).toBe(true);
			}

			const stepIds = new Set<string>();
			for (const step of tutorial.steps) {
				expect(stepIds.has(step.id)).toBe(false);
				stepIds.add(step.id);
				expect(step.title).toBeTruthy();
				expect(step.body.length).toBeGreaterThan(40);
				expect(step.points.length).toBeGreaterThan(0);
				expect([
					'zen-pillars',
					'destination-types',
					'announce-flood',
					'crypto-stack',
					'packet-path',
					'packet-wireframe',
					'link-lifecycle',
					'interfaces-mesh',
					'messaging-flow'
				]).toContain(step.visual);
			}
		}
	});

	it('includes Python and Go samples on key learning steps', () => {
		const withCode = tutorials.flatMap((t) => t.steps.filter((s) => s.code));
		expect(withCode.length).toBeGreaterThanOrEqual(5);
		for (const step of withCode) {
			expect(step.code?.python).toMatch(/RNS/);
			expect(step.code?.go).toMatch(/quad4\/reticulum-go|package /);
		}
	});

	it('states verified protocol constants where claimed', () => {
		const announces = getTutorial('announces-and-paths');
		const crypto = getTutorial('cryptography');
		const destinations = getTutorial('destinations');
		const packets = getTutorial('packets-and-hops');

		expect(announces?.steps.some((s) => s.points.some((p) => p.includes('128')))).toBe(true);
		expect(
			destinations?.steps.some((s) => /16-byte|128-bit/i.test(s.body + s.points.join(' ')))
		).toBe(true);
		expect(
			crypto?.steps.some((s) =>
				/AES-256-CBC|X25519|Ed25519|HMAC-SHA256/i.test(s.body + s.points.join(' '))
			)
		).toBe(true);
		expect(
			packets?.steps.some((s) =>
				/plain destination|not transported over multiple hops|do not/i.test(
					s.body + s.points.join(' ')
				)
			)
		).toBe(true);
	});

	it('links cryptography tutorial to official and project docs', () => {
		const crypto = getTutorial('cryptography');
		expect(crypto?.sources.some((s) => s.href.includes('reticulum.network'))).toBe(true);
		expect(crypto?.sources.some((s) => s.href === '/docs/cryptography')).toBe(true);
	});
});

describe('tutorial interactives', () => {
	it('rejects hop counts at PATHFINDER_M and above', () => {
		expect(PATHFINDER_M).toBe(128);
		expect(evaluateHopLimit(127).accepted).toBe(true);
		expect(evaluateHopLimit(128).accepted).toBe(false);
		expect(evaluateHopLimit(255).accepted).toBe(false);
	});

	it('marks plain destinations as local-only', () => {
		expect(DESTINATION_RULES.plain.multiHop).toBe(false);
		expect(DESTINATION_RULES.plain.encrypted).toBe(false);
		expect(DESTINATION_RULES.single.multiHop).toBe(true);
		expect(DESTINATION_RULES.single.encrypted).toBe(true);
	});

	it('exposes a full crypto pipeline ending in HMAC verify-before-decrypt intent', () => {
		expect(CRYPTO_PIPELINE.map((s) => s.id)).toEqual(['ephemeral', 'ecdh', 'hkdf', 'aes', 'hmac']);
		expect(CRYPTO_PIPELINE.at(-1)?.detail.toLowerCase()).toMatch(/verify/);
	});

	it('builds an announce replay with increasing hops', () => {
		const frames = buildAnnounceReplay();
		expect(frames.length).toBeGreaterThan(1);
		expect(frames[0].hop).toBe(0);
		expect(frames.at(-1)?.hop).toBeGreaterThan(frames[0].hop);
	});

	it('exposes link stages ending in close', () => {
		expect(LINK_STAGES.map((s) => s.id)).toEqual([
			'linkrequest',
			'linkidentify',
			'linkready',
			'linkclose'
		]);
	});

	it('marks RNode as not yet available in Go', () => {
		expect(INTERFACE_CARDS.lora.inGo).toBe(false);
		expect(INTERFACE_CARDS.tcp.inGo).toBe(true);
		expect(INTERFACE_CARDS.websocket.inGo).toBe(true);
	});

	it('keeps plain packet sim local-only on step', () => {
		const result = stepPacketSim('plain', 0, 0);
		expect(result.status).toBe('local-only');
		expect(result.nodeIndex).toBe(0);
		expect(result.hops).toBe(0);
	});

	it('delivers encrypted packet sim across the path', () => {
		let node = 0;
		let hops = 0;
		let status: ReturnType<typeof stepPacketSim>['status'] = 'moving';
		while (status === 'moving') {
			const next = stepPacketSim('encrypted', node, hops);
			node = next.nodeIndex;
			hops = next.hops;
			status = next.status;
		}
		expect(status).toBe('delivered');
		expect(node).toBe(3);
	});

	it('drops encrypted packet sim at PATHFINDER_M hops', () => {
		const result = stepPacketSim('encrypted', 1, PATHFINDER_M);
		expect(result.status).toBe('dropped');
		expect(result.hops).toBe(PATHFINDER_M);
	});

	it('ends link sim frames with linkclose and includes a canSendData frame', () => {
		expect(LINK_SIM_FRAMES.at(-1)?.id).toBe('linkclose');
		expect(LINK_SIM_FRAMES.some((frame) => frame.canSendData)).toBe(true);
	});

	it('exposes identity, resource, and lxmf flow stages', () => {
		expect(IDENTITY_RECALL_STAGES.map((s) => s.id)).toEqual([
			'create',
			'persist',
			'announce',
			'recall',
			'outbound'
		]);
		expect(RESOURCE_PATH_STAGES.map((s) => s.id)).toEqual([
			'link-ready',
			'request',
			'channel',
			'buffer',
			'resource'
		]);
		expect(LXMF_FLOW_STAGES.at(-1)?.id).toBe('app');
	});

	it('includes transport field only on header type 2 wireframe', () => {
		const type1 = PACKET_WIRE_FIELDS.filter((field) => field.headerTypes.includes(1));
		const type2 = PACKET_WIRE_FIELDS.filter((field) => field.headerTypes.includes(2));
		expect(type1.some((field) => field.id === 'transport')).toBe(false);
		expect(type2.some((field) => field.id === 'transport')).toBe(true);
		expect(type2.length).toBe(type1.length + 1);
	});

	it('models blackhole announce drop when enabled', () => {
		expect(blackholeAnnounceOutcome(false).status).toBe('accepted');
		expect(blackholeAnnounceOutcome(true).status).toBe('dropped');
		expect(blackholeAnnounceOutcome(true).detail.toLowerCase()).toMatch(/drop/);
	});

	it('lists discovery modes with boundary blocking unknown path by default', () => {
		expect(DISCOVERY_MODES.length).toBeGreaterThan(3);
		const boundary = DISCOVERY_MODES.find((mode) => mode.id === 'boundary');
		expect(boundary?.allowsUnknownPath).toBe(false);
		expect(DISCOVERY_MODES.filter((mode) => mode.allowsUnknownPath).length).toBeGreaterThan(1);
	});
});
