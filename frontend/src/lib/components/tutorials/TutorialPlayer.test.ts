import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/svelte';

vi.mock('svelte-i18n', () => import('../../../test/i18n-mocks').then((m) => m.getMockI18nStores()));

import TutorialPlayer from './TutorialPlayer.svelte';
import { getTutorial, listTutorials } from '$lib/tutorials';

describe('TutorialPlayer', () => {
	beforeEach(() => {
		cleanup();
	});

	it('renders the first step and advances with Next', async () => {
		const tutorial = getTutorial('destinations');
		expect(tutorial).toBeTruthy();
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		expect(screen.getByText(tutorial!.steps[0].title)).toBeTruthy();
		await fireEvent.click(screen.getByRole('button', { name: 'Next' }));
		expect(screen.getByText(tutorial!.steps[1].title)).toBeTruthy();
	});

	it('advances with ArrowRight and goes back with ArrowLeft', async () => {
		const tutorial = getTutorial('destinations');
		render(TutorialPlayer, { props: { tutorial: tutorial! } });

		expect(screen.getByText(tutorial!.steps[0].title)).toBeTruthy();
		await fireEvent.keyDown(window, { key: 'ArrowRight' });
		expect(screen.getByText(tutorial!.steps[1].title)).toBeTruthy();
		await fireEvent.keyDown(window, { key: 'ArrowLeft' });
		expect(screen.getByText(tutorial!.steps[0].title)).toBeTruthy();
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

		for (const chapter of chapters) {
			const link = screen.getByRole('link', { name: new RegExp(chapter.title) });
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

		const slider = screen.getByRole('slider');
		await fireEvent.input(slider, { target: { value: '128' } });
		expect(screen.getByText('Rejected')).toBeTruthy();
		expect(screen.getByText(/Hop byte 128 is >= PATHFINDER_M/)).toBeTruthy();
	});
});
