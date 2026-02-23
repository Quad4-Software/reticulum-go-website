import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Skeleton from './Skeleton.svelte';

describe('Skeleton', () => {
	it('renders single line by default', () => {
		const { container } = render(Skeleton);
		const lines = container.querySelectorAll('.rounded.bg-zinc-200');
		expect(lines.length).toBe(1);
	});

	it('renders multiple lines when specified', () => {
		const { container } = render(Skeleton, { props: { lines: 4 } });
		const lines = container.querySelectorAll('.rounded.bg-zinc-200');
		expect(lines.length).toBe(4);
	});

	it('applies custom class', () => {
		const { container } = render(Skeleton, { props: { class: 'w-32' } });
		const wrapper = container.firstElementChild;
		expect(wrapper?.classList.contains('w-32')).toBe(true);
	});

	it('applies custom height via style', () => {
		const { container } = render(Skeleton, { props: { height: '2rem' } });
		const line = container.querySelector('.rounded');
		expect((line as HTMLElement)?.style.height).toBe('2rem');
	});

	it('has overflow-safe structure', () => {
		const { container } = render(Skeleton, { props: { lines: 3 } });
		const wrapper = container.firstElementChild;
		expect(wrapper).toBeTruthy();
		expect(wrapper?.children.length).toBe(3);
	});
});
