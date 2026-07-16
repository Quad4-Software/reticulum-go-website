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
	| 'packet-wireframe'
	| 'link-lifecycle'
	| 'interfaces-mesh'
	| 'messaging-flow';

export type TutorialLang = 'python' | 'go';

export type TutorialInteractiveId =
	| 'destination-type'
	| 'hop-limit'
	| 'crypto-pipeline'
	| 'announce-replay'
	| 'link-sim'
	| 'packet-sim'
	| 'packet-wireframe'
	| 'blackhole-toggle'
	| 'discovery-modes'
	| 'interface-pick'
	| 'identity-recall'
	| 'resource-path'
	| 'lxmf-flow';

export type TutorialSource = {
	id: string;
	label: string;
	href: string;
};

export type TutorialPracticeLink = {
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
	/** Optional practice links shown under the code panel. */
	practiceLinks?: TutorialPracticeLink[];
};

export type TutorialStep = {
	id: string;
	title: string;
	/** Short prose shown beside the visual. Keep factual and citeable. */
	body: string;
	/** Bullet callouts grounded in protocol docs. */
	points: string[];
	visual: TutorialVisualId;
	/**
	 * Explicit highlight index for the visual.
	 * Prefer this over relying on chapter stepIndex alone.
	 */
	visualFocus?: number;
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
	/** One-line spine blurb for the hub recommended path. */
	learnLine: string;
	/** Why this tutorial exists, tied to Reticulum design goals. */
	zenNote: string;
	sources: TutorialSource[];
	steps: TutorialStep[];
};

export type TutorialCatalogEntry = Pick<
	Tutorial,
	'slug' | 'title' | 'summary' | 'tags' | 'learnLine'
> & {
	stepCount: number;
};
