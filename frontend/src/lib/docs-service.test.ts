import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc, getAllDocsForLang, hasAnyDocs } from './db';
import type { DBDoc } from './db';

vi.mock('./db', () => ({
	saveDoc: vi.fn(),
	getDoc: vi.fn(),
	getAllDocsForLang: vi.fn(),
	hasAnyDocs: vi.fn()
}));

describe('docs-service', () => {
	beforeEach(() => {
		vi.mocked(getDoc).mockResolvedValue(null);
		vi.mocked(getAllDocsForLang).mockResolvedValue([]);
		vi.mocked(hasAnyDocs).mockResolvedValue(false);
	});

	it('getDocContent returns cached content when available', async () => {
		const { getDocContent } = await import('./docs-service');
		vi.mocked(getDoc).mockResolvedValue({
			slug: 'intro',
			lang: 'en',
			content: '# Cached',
			updatedAt: 1
		});
		const content = await getDocContent('intro', 'en');
		expect(content).toBe('# Cached');
	});

	it('getDocContent returns null when no cache and sync fails', async () => {
		const { getDocContent } = await import('./docs-service');
		vi.mocked(getDoc).mockResolvedValue(null);
		const content = await getDocContent('nonexistent', 'en');
		expect(content).toBeNull();
	});

	it('downloadAllDocs creates zip when docs exist', async () => {
		const { downloadAllDocs } = await import('./docs-service');
		const mockDocs: DBDoc[] = [
			{ slug: 'a', lang: 'en', content: 'A', updatedAt: 1 },
			{ slug: 'b', lang: 'en', content: 'B', updatedAt: 2 }
		];
		vi.mocked(getAllDocsForLang).mockResolvedValue(mockDocs);
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
		await downloadAllDocs('en');
		expect(clickSpy).toHaveBeenCalled();
		clickSpy.mockRestore();
	});

	it('downloadAllDocs does nothing when no docs after sync', async () => {
		const { downloadAllDocs } = await import('./docs-service');
		vi.mocked(getAllDocsForLang).mockResolvedValue([]);
		const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
		await downloadAllDocs('en');
		expect(clickSpy).not.toHaveBeenCalled();
		clickSpy.mockRestore();
	});
});
