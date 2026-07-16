import type { Tutorial, TutorialCatalogEntry } from './types';
import { zenTutorial } from './reticulum/zen';
import { destinationsTutorial } from './reticulum/destinations';
import { identitiesTutorial } from './reticulum/identities';
import { announcesTutorial } from './reticulum/announces';
import { cryptographyTutorial } from './reticulum/cryptography';
import { packetsTutorial } from './reticulum/packets';
import { linksTutorial } from './reticulum/links';
import { messagingTutorial } from './reticulum/messaging';
import { interfacesTutorial } from './reticulum/interfaces';

const tutorials: Tutorial[] = [
	zenTutorial,
	destinationsTutorial,
	identitiesTutorial,
	announcesTutorial,
	cryptographyTutorial,
	packetsTutorial,
	linksTutorial,
	messagingTutorial,
	interfacesTutorial
];

export function listTutorials(): TutorialCatalogEntry[] {
	return tutorials.map(({ slug, title, summary, tags, learnLine, steps }) => ({
		slug,
		title,
		summary,
		tags,
		learnLine,
		stepCount: steps.length
	}));
}

export function getTutorial(slug: string): Tutorial | undefined {
	return tutorials.find((t) => t.slug === slug);
}

export function getTutorialSlugs(): string[] {
	return tutorials.map((t) => t.slug);
}

export function getTutorialIndex(slug: string): number {
	return tutorials.findIndex((t) => t.slug === slug);
}

export function getNextTutorial(slug: string): TutorialCatalogEntry | undefined {
	const index = getTutorialIndex(slug);
	if (index < 0 || index >= tutorials.length - 1) return undefined;
	const next = tutorials[index + 1];
	return {
		slug: next.slug,
		title: next.title,
		summary: next.summary,
		tags: next.tags,
		learnLine: next.learnLine,
		stepCount: next.steps.length
	};
}

export function getPreviousTutorial(slug: string): TutorialCatalogEntry | undefined {
	const index = getTutorialIndex(slug);
	if (index <= 0) return undefined;
	const prev = tutorials[index - 1];
	return {
		slug: prev.slug,
		title: prev.title,
		summary: prev.summary,
		tags: prev.tags,
		learnLine: prev.learnLine,
		stepCount: prev.steps.length
	};
}

export { tutorials };
