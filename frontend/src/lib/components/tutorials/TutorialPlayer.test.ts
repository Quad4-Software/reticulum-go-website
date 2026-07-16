import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen, within } from '@testing-library/svelte';

const goto = vi.fn();

let mockUrl = new URL('http://localhost/tools/reticulum-guide/destinations');

vi.mock('$app/state', () => ({
	get page() {
		return { url: mockUrl };
	}
}));

vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => goto(...args)
}));

vi.mock('svelte-i18n', () => import('../../../test/i18n-mocks').then((m) => m.getMockI18nStores()));

import TutorialPlayer from './TutorialPlayer.svelte';
import { getTutorial, listTutorials, getNextTutorial } from '$lib/tutorials';

function stepHeading(name: string | RegExp) {
	return screen.getByRole('heading', { level: 2, name });
}

describe('TutorialPlayer', () => {
	beforeEach(() => {
		cleanup();
		goto.mockClear();
		mockUrl = new URL('http://localhost/tools/reticulum-guide/destinations');
	});

	it('renders the first step and advances with Next', async () => {
		const tutorial = getTutorial('destinations');
		expect(tutorial).toBeTruthy();
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		expect(stepHeading(tutorial!.steps[0].title)).toBeTruthy();
		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		expect(stepHeading(tutorial!.steps[1].title)).toBeTruthy();
	});

	it('advances with ArrowRight and goes back with ArrowLeft', async () => {
		const tutorial = getTutorial('destinations');
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		expect(stepHeading(tutorial!.steps[0].title)).toBeTruthy();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(stepHeading(tutorial!.steps[1].title)).toBeTruthy();
		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(stepHeading(tutorial!.steps[0].title)).toBeTruthy();
	});

	it('lists cited sources without duplicate keys', () => {
		const tutorial = getTutorial('zen-and-goals');
		expect(tutorial).toBeTruthy();
		const ids = tutorial!.sources.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);

		render(TutorialPlayer, { props: { tutorial: tutorial! } });
		for (const source of tutorial!.sources) {
			expect(screen.getByRole('link', { name: source.label })).toBeTruthy();
		}
	});

	it('shows chapter sidebar links for every catalog entry', () => {
		const tutorial = getTutorial('cryptography');
		const chapters = listTutorials();
		render(TutorialPlayer, { props: { tutorial: tutorial!, chapters } });

		const chaptersNav = screen.getByRole('navigation', { name: 'Chapters' });
		for (const chapter of chapters) {
			const link = within(chaptersNav).getByRole('link', { name: new RegExp(chapter.title) });
			expect(link.getAttribute('href')).toBe(`/tools/reticulum-guide/${chapter.slug}`);
		}
	});

	it('toggles Python and Go samples when a step has code', async () => {
		const tutorial = getTutorial('zen-and-goals');
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));

		expect(screen.getByRole('button', { name: 'Python' })).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Go' })).toBeTruthy();
		expect(screen.getByText(/RNS\.Reticulum/)).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Go' }));
		expect(screen.getByText(/quad4\/reticulum-go\/pkg\/destination/)).toBeTruthy();
	});

	it('lets learners reject packets at PATHFINDER_M in the hop interactive', async () => {
		const tutorial = getTutorial('packets-and-hops');
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		await fireEvent.click(screen.getByRole('button', { name: 'Forwarding without full routes' }));

		const slider = screen.getByRole('slider');
		await fireEvent.input(slider, { target: { value: '128' } });
		expect(screen.getByText('Rejected')).toBeTruthy();
		expect(screen.getByText(/Hop byte 128 is >= PATHFINDER_M/)).toBeTruthy();
	});

	it('shows tryIt above the interactive when both are present', () => {
		const tutorial = getTutorial('packets-and-hops');
		expect(tutorial).toBeTruthy();
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		const tryItText = tutorial!.steps[0].tryIt!;
		expect(screen.getByText(/Try it:/)).toBeTruthy();
		expect(screen.getByText(tryItText)).toBeTruthy();
	});

	it('shows next chapter link on the last step', async () => {
		const tutorial = getTutorial('destinations');
		expect(tutorial).toBeTruthy();
		const nextChapter = getNextTutorial('destinations');
		expect(nextChapter).toBeTruthy();

		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		const lastIndex = tutorial!.steps.length - 1;
		for (let i = 0; i < lastIndex; i += 1) {
			await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		}

		const nextLink = screen.getByRole('link', {
			name: `Next chapter: ${nextChapter!.title}`
		});
		expect(nextLink.getAttribute('href')).toBe(`/tools/reticulum-guide/${nextChapter!.slug}`);
	});

	it('initializes from step query param by id and syncs URL on change', async () => {
		const tutorial = getTutorial('destinations');
		expect(tutorial).toBeTruthy();
		const targetStep = tutorial!.steps[2];
		mockUrl = new URL(`http://localhost/tools/reticulum-guide/destinations?step=${targetStep.id}`);

		render(TutorialPlayer, { props: { tutorial: tutorial! } });
		expect(stepHeading(targetStep.title)).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		expect(goto).toHaveBeenCalled();
		const lastCall = goto.mock.calls[goto.mock.calls.length - 1];
		expect(String(lastCall[0])).toContain(`step=${tutorial!.steps[3].id}`);
	});
});
