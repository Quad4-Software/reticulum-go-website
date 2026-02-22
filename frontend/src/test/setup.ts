import 'fake-indexeddb/auto';
import { vi } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$app/navigation', () => ({
	invalidate: vi.fn()
}));
