import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$app/navigation', () => ({
	invalidate: vi.fn()
}));

if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	(Element.prototype as unknown as Record<string, unknown>).animate = vi.fn(() => ({
		finish: vi.fn(),
		cancel: vi.fn(),
		play: vi.fn(),
		pause: vi.fn(),
		finished: Promise.resolve()
	}));
}
