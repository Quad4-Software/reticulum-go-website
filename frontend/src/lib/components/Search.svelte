<script lang="ts">
	import { Search as SearchIcon, FileText } from 'lucide-svelte';
	import Fuse, { type FuseResultMatch } from 'fuse.js';
	import { locale } from 'svelte-i18n';
	import { marked } from 'marked';
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';

	interface DocItem {
		slug: string;
		title: string;
		content: string;
		path: string;
	}

	interface SearchResult {
		item: DocItem;
		matches?: readonly FuseResultMatch[];
	}

	let isOpen = $state(false);
	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let selectedIndex = $state(0);
	let isLoading = $state(false);
	let fuse: Fuse<DocItem> | null = null;
	let searchInput: HTMLInputElement | undefined = $state();

	const modules = import.meta.glob('../../lib/docs/**/*.{md,mdx}', {
		query: '?raw',
		import: 'default',
		eager: true
	});

	async function buildIndex() {
		isLoading = true;
		const currentLocale = $locale || 'en';

		const slugMap: Record<string, { path: string; content: string; locale: string }> = {};

		Object.entries(modules).forEach(([path, content]) => {
			const filename = path.split('/').pop() || '';
			const parts = filename.split('.');
			const slug = parts[0];

			let docLocale = 'en';
			if (parts.length >= 3) {
				docLocale = parts[1];
			}

			if (docLocale === currentLocale || (currentLocale !== 'en' && docLocale === 'en')) {
				const existing = slugMap[slug];
				if (!existing || (existing.locale !== currentLocale && docLocale === currentLocale)) {
					slugMap[slug] = { path, content: content as string, locale: docLocale };
				}
			}
		});

		const processedDocs = await Promise.all(
			Object.entries(slugMap).map(async ([slug, data]) => {
				const html = await marked.parse(data.content);
				const tempDiv = document.createElement('div');
				tempDiv.innerHTML = html;
				const text = tempDiv.textContent || '';

				const titleMatch = data.content.match(/^#\s+(.+)$/m);
				const title = titleMatch ? titleMatch[1] : slug.charAt(0).toUpperCase() + slug.slice(1);

				return {
					slug,
					title,
					content: text,
					path: `/docs/${slug}`
				};
			})
		);

		fuse = new Fuse(processedDocs, {
			keys: [
				{ name: 'title', weight: 0.7 },
				{ name: 'content', weight: 0.3 }
			],
			includeMatches: true,
			threshold: 0.3,
			ignoreLocation: true
		});

		isLoading = false;
	}

	$effect(() => {
		if (isOpen) {
			buildIndex();
			tick().then(() => searchInput?.focus());
		}
	});

	function handleSearch() {
		if (!fuse) return;
		results = fuse.search(query).map((r) => ({
			item: r.item,
			matches: r.matches
		}));
		selectedIndex = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = (selectedIndex + 1) % results.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = (selectedIndex - 1 + results.length) % results.length;
		} else if (e.key === 'Enter') {
			e.preventDefault();
			if (results[selectedIndex]) {
				goToResult(results[selectedIndex].item);
			}
		} else if (e.key === 'Escape') {
			isOpen = false;
		}
	}

	function getSnippet(item: DocItem, matches?: readonly FuseResultMatch[]) {
		const match = matches?.find((m) => m.key === 'content');
		if (!match || !match.indices.length) return item.content.slice(0, 100) + '...';

		const [start, end] = match.indices[0];
		const contextStart = Math.max(0, start - 40);
		const contextEnd = Math.min(item.content.length, end + 60);

		let text = item.content.slice(contextStart, contextEnd);

		if (contextStart > 0) text = '...' + text;
		if (contextEnd < item.content.length) text = text + '...';

		return text;
	}

	function goToResult(item: DocItem) {
		isOpen = false;
		goto(item.path);
	}

	function close() {
		isOpen = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (isOpen) {
				e.preventDefault();
				isOpen = false;
			}
			return;
		}
		const target = e.target as HTMLElement;
		const isInput =
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
		if (e.key === '/' && !isInput) {
			e.preventDefault();
			isOpen = true;
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			isOpen = true;
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<button
	onclick={() => (isOpen = true)}
	class="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors text-left"
>
	<SearchIcon class="w-4 h-4" />
	<span class="flex-1">Search docs...</span>
	<div class="hidden md:flex items-center gap-1">
		<kbd
			class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
			>/</kbd
		>
		<kbd
			class="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
		>
			<span class="text-xs">⌘</span>K
		</kbd>
	</div>
</button>

{#if isOpen}
	<div class="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4 sm:px-6">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
			onclick={close}
		></div>

		<div
			class="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800 overflow-hidden flex flex-col max-h-[60vh]"
		>
			<div class="flex items-center border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
				<SearchIcon class="w-5 h-5 text-zinc-400 mr-3" />
				<input
					bind:this={searchInput}
					bind:value={query}
					oninput={handleSearch}
					onkeydown={handleKeydown}
					placeholder="Search documentation..."
					class="flex-1 bg-transparent border-none outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 h-6"
				/>
				{#if isLoading}
					<div class="ml-2 w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
				{:else}
					<button
						onclick={close}
						class="ml-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
					>
						<kbd
							class="text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
							>ESC</kbd
						>
					</button>
				{/if}
			</div>

			<div class="flex-1 overflow-y-auto p-2">
				{#if query === ''}
					<div class="text-center py-12 text-zinc-500 text-sm">Type to search documentation</div>
				{:else if results.length === 0}
					<div class="text-center py-12 text-zinc-500 text-sm">
						No results found for "{query}"
					</div>
				{:else}
					<div class="space-y-1">
						{#each results as { item, matches }, i (item.path)}
							<button
								class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors {i ===
								selectedIndex
									? 'bg-zinc-100 dark:bg-zinc-800'
									: 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}"
								onclick={() => goToResult(item)}
								onmouseenter={() => (selectedIndex = i)}
							>
								<div
									class="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0"
								>
									<FileText class="w-4 h-4 text-zinc-500" />
								</div>
								<div class="min-w-0 flex-1">
									<h4 class="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
										{item.title}
									</h4>
									<p class="text-xs text-zinc-500 truncate">
										{getSnippet(item, matches)}
									</p>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div
				class="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-zinc-50 dark:bg-zinc-900/50"
			>
				<div class="flex items-center justify-between text-xs text-zinc-500">
					<span>Search by Fuse.js</span>
					<div class="flex flex-wrap gap-2">
						<span class="flex items-center gap-1"
							><kbd
								class="px-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
								>/</kbd
							> search</span
						>
						<span class="flex items-center gap-1"
							><kbd
								class="px-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
								>↑↓</kbd
							> navigate</span
						>
						<span class="flex items-center gap-1"
							><kbd
								class="px-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
								>↵</kbd
							> select</span
						>
						<span class="flex items-center gap-1"
							><kbd
								class="px-1 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
								>Esc</kbd
							> close</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
