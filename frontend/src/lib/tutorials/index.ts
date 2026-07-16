import type { Tutorial, TutorialCatalogEntry } from './types';
import { zenTutorial } from './reticulum/zen';
import { destinationsTutorial } from './reticulum/destinations';
import { identitiesTutorial } from './reticulum/identities';
import { announcesTutorial } from './reticulum/announces';
import { cryptographyTutorial } from './reticulum/cryptography';
import { packetsTutorial } from './reticulum/packets';
import { linksTutorial } from './reticulum/links';
import { interfacesTutorial } from './reticulum/interfaces';

const tutorials: Tutorial[] = [
	zenTutorial,
	destinationsTutorial,
	identitiesTutorial,
	announcesTutorial,
	cryptographyTutorial,
	packetsTutorial,
	linksTutorial,
	interfacesTutorial
];

export function listTutorials(): TutorialCatalogEntry[] {
	return tutorials.map(({ slug, title, summary, tags }) => ({
		slug,
		title,
		summary,
		tags
	}));
}

export function getTutorial(slug: string): Tutorial | undefined {
	return tutorials.find((t) => t.slug === slug);
}

export function getTutorialSlugs(): string[] {
	return tutorials.map((t) => t.slug);
}

export { tutorials };
