/**
 * Tutorial content model for interactive Reticulum explainers.
 * Facts should cite verified sources (official manual or project docs).
 */

export type TutorialVisualId =
	| 'zen-pillars'
	| 'destination-types'
	| 'announce-flood'
	| 'crypto-stack'
	| 'packet-path'
	| 'link-lifecycle'
	| 'interfaces-mesh';

export type TutorialLang = 'python' | 'go';

export type TutorialInteractiveId =
	| 'destination-type'
	| 'hop-limit'
	| 'crypto-pipeline'
	| 'announce-replay'
	| 'link-stages'
	| 'interface-pick';

export type TutorialSource = {
	id: string;
	label: string;
	href: string;
};

export type TutorialCodePair = {
	/** Short caption shown above the code panel. */
	caption: string;
	python: string;
	go: string;
	/** Strings that must appear in the Python sample (API sanity check). */
	pythonRequires?: string[];
	/** Strings that must appear in the Go sample (API sanity check). */
	goRequires?: string[];
};

export type TutorialStep = {
	id: string;
	title: string;
	/** Short prose shown beside the visual. Keep factual and citeable. */
	body: string;
	/** Bullet callouts grounded in protocol docs. */
	points: string[];
	visual: TutorialVisualId;
	code?: TutorialCodePair;
	interactive?: TutorialInteractiveId;
	/** What happens when the learner tries the interactive control. */
	tryIt?: string;
};

export type Tutorial = {
	slug: string;
	title: string;
	summary: string;
	tags: string[];
	/** Why this tutorial exists, tied to Reticulum design goals. */
	zenNote: string;
	sources: TutorialSource[];
	steps: TutorialStep[];
};

export type TutorialCatalogEntry = Pick<Tutorial, 'slug' | 'title' | 'summary' | 'tags'>;
