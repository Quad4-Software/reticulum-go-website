<script lang="ts">
	import { marked } from 'marked';
	import { sanitizeHtml } from '$lib/sanitize-html';

	let { content = '' } = $props();

	let html = $derived(sanitizeHtml(String(marked.parse(content))));
</script>

<div class="prose prose-zinc dark:prose-invert max-w-none">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html html}
</div>

<style>
	:global(.prose strong) {
		color: hsl(var(--foreground));
		font-weight: 800;
	}
</style>
