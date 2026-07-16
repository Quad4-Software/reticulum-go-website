<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import { SITE_URL } from '$lib/site-config';
	import { jsonLdScript } from '$lib/seo';

	interface BreadcrumbItem {
		label: string;
		href?: string;
	}

	let { items, class: className = '' }: { items: BreadcrumbItem[]; class?: string } = $props();

	const breadcrumbJsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: items.map((item, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: item.label,
				...(item.href && { item: `${SITE_URL}${item.href}` })
			}))
		})
	);
	const scriptTag = $derived(jsonLdScript(breadcrumbJsonLd));
</script>

{@html scriptTag}

<nav
	aria-label="Breadcrumb"
	class="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 {className}"
>
	{#each items as item, i (item.label + (item.href ?? ''))}
		{#if i > 0}
			<ChevronRight class="w-4 h-4 shrink-0 text-zinc-400" />
		{/if}
		{#if item.href}
			<a href={item.href} class="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
				{item.label}
			</a>
		{:else}
			<span class="text-zinc-900 dark:text-zinc-100 font-medium">{item.label}</span>
		{/if}
	{/each}
</nav>
