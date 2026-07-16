import type { Tutorial, TutorialCodePair, TutorialStep } from './types';

const EM_DASH = '\u2014';
const EN_DASH = '\u2013';

export type TutorialValidationIssue = {
	slug: string;
	stepId?: string;
	message: string;
};

function scanProse(
	slug: string,
	stepId: string | undefined,
	text: string,
	issues: TutorialValidationIssue[]
) {
	if (text.includes(EM_DASH) || text.includes(EN_DASH)) {
		issues.push({
			slug,
			stepId,
			message: 'Prose must not use em or en dashes. Prefer commas or separate sentences.'
		});
	}
	if (text.includes(';')) {
		issues.push({
			slug,
			stepId,
			message: 'Prose must not use semicolons. Prefer short sentences.'
		});
	}
}

function validateCodePair(
	slug: string,
	step: TutorialStep,
	code: TutorialCodePair,
	issues: TutorialValidationIssue[]
) {
	if (!code.python.trim() || !code.go.trim()) {
		issues.push({ slug, stepId: step.id, message: 'Code pair needs both Python and Go samples.' });
	}
	if (!code.python.includes('RNS.') && !code.python.includes('import RNS')) {
		issues.push({
			slug,
			stepId: step.id,
			message: 'Python sample should reference the RNS package.'
		});
	}
	if (!code.go.includes('package ') && !code.go.includes('quad4/reticulum-go')) {
		issues.push({
			slug,
			stepId: step.id,
			message: 'Go sample should look like Go (package clause or reticulum-go import).'
		});
	}
	for (const needle of code.pythonRequires ?? []) {
		if (!code.python.includes(needle)) {
			issues.push({
				slug,
				stepId: step.id,
				message: `Python sample missing required fragment: ${needle}`
			});
		}
	}
	for (const needle of code.goRequires ?? []) {
		if (!code.go.includes(needle)) {
			issues.push({
				slug,
				stepId: step.id,
				message: `Go sample missing required fragment: ${needle}`
			});
		}
	}
}

/**
 * Structural and API sanity checks for tutorial catalog content.
 * Does not execute Go or Python. It verifies citeable shape and required APIs.
 */
export function validateTutorial(tutorial: Tutorial): TutorialValidationIssue[] {
	const issues: TutorialValidationIssue[] = [];

	scanProse(tutorial.slug, undefined, tutorial.title, issues);
	scanProse(tutorial.slug, undefined, tutorial.summary, issues);
	scanProse(tutorial.slug, undefined, tutorial.zenNote, issues);

	if (tutorial.steps.length < 2) {
		issues.push({ slug: tutorial.slug, message: 'Tutorial needs at least two steps.' });
	}

	const stepIds = new Set<string>();
	for (const step of tutorial.steps) {
		if (stepIds.has(step.id)) {
			issues.push({ slug: tutorial.slug, stepId: step.id, message: 'Duplicate step id.' });
		}
		stepIds.add(step.id);

		scanProse(tutorial.slug, step.id, step.title, issues);
		scanProse(tutorial.slug, step.id, step.body, issues);
		for (const point of step.points) {
			scanProse(tutorial.slug, step.id, point, issues);
		}
		if (step.tryIt) {
			scanProse(tutorial.slug, step.id, step.tryIt, issues);
		}
		if (step.code) {
			validateCodePair(tutorial.slug, step, step.code, issues);
		}
		if (step.interactive && !step.tryIt) {
			issues.push({
				slug: tutorial.slug,
				stepId: step.id,
				message: 'Interactive steps need a tryIt hint for learners.'
			});
		}
	}

	const sourceIds = new Set<string>();
	for (const source of tutorial.sources) {
		if (sourceIds.has(source.id)) {
			issues.push({ slug: tutorial.slug, message: `Duplicate source id: ${source.id}` });
		}
		sourceIds.add(source.id);
		if (!source.href.startsWith('http') && !source.href.startsWith('/docs/')) {
			issues.push({
				slug: tutorial.slug,
				message: `Source href must be http(s) or /docs/: ${source.href}`
			});
		}
		scanProse(tutorial.slug, undefined, source.label, issues);
	}

	return issues;
}

export function validateAllTutorials(list: Tutorial[]): TutorialValidationIssue[] {
	return list.flatMap((tutorial) => validateTutorial(tutorial));
}
