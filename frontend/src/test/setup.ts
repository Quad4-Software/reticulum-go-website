import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('$app/env', () => ({
	browser: true
}));

vi.mock('$app/navigation', () => ({
	invalidate: vi.fn()
}));

URL.createObjectURL = vi.fn(() => 'blob:mock');
URL.revokeObjectURL = vi.fn();

// jsdom's Blob lacks stream(), which shiki's inlined wasm loader requires.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.stream !== 'function') {
	Blob.prototype.stream = function (this: Blob) {
		return new ReadableStream({
			start: async (controller) => {
				controller.enqueue(new Uint8Array(await this.arrayBuffer()));
				controller.close();
			}
		});
	};
}

if (typeof Element !== 'undefined' && !Element.prototype.animate) {
	(Element.prototype as unknown as Record<string, unknown>).animate = vi.fn(() => ({
		finish: vi.fn(),
		cancel: vi.fn(),
		play: vi.fn(),
		pause: vi.fn(),
		finished: Promise.resolve()
	}));
}
