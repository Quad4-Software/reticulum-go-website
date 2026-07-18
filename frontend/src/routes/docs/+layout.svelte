<script lang="ts">
	import { page } from '$app/state';
	import {
		BookOpen,
		FileText,
		Shield,
		Settings,
		Network,
		Link,
		Lock,
		GitCompare,
		Terminal,
		Code,
		Boxes,
		FlaskConical,
		ChevronRight,
		Download,
		Menu,
		X
	} from 'lucide-svelte';
	import { t, locale } from 'svelte-i18n';
	import Search from '$lib/components/Search.svelte';
	import { DOC_NAV } from '$lib/docs-config';
	import { downloadAllDocs, syncEverything } from '$lib/docs-service';
	import { onMount } from 'svelte';

	const DOC_ICONS: Record<string, typeof BookOpen> = {
		overview: BookOpen,
		'getting-started': FileText,
		examples: FlaskConical,
		architecture: Boxes,
		'package-map': Code,
		microvm: Boxes,
		configuration: Settings,
		interfaces: Network,
		transport: Network,
		'identity-and-destinations': Lock,
		'links-channels-and-resources': Link,
		cryptography: Lock,
		'embedding-and-wasm': Code,
		'control-api': Terminal,
		compatibility: GitCompare,
		security: Shield,
		'development-and-testing': FlaskConical
	};

	let { children } = $props();

	let mobileMenuOpen = $state(false);

	onMount(() => {
		if (navigator.onLine) {
			syncEverything().catch(console.error);
		}
	});

	function isActive(slug: string): boolean {
		return page.url.pathname === `/docs/${slug}`;
	}

	const currentDoc = $derived(
		DOC_NAV.flatMap((section) => section.items).find((doc) => isActive(doc.slug))
	);
	const CurrentIcon = $derived(currentDoc ? (DOC_ICONS[currentDoc.slug] ?? FileText) : BookOpen);

	function openMobileMenu() {
		mobileMenuOpen = true;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (mobileMenuOpen && event.key === 'Escape') closeMobileMenu();
	}

	$effect(() => {
		void page.url.pathname;
		mobileMenuOpen = false;
	});

	$effect(() => {
		if (!mobileMenuOpen) return;
		const original = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = original;
		};
	});
</script>

{#snippet navContent()}
	<div class="mb-6">
		<Search />
	</div>
	<p class="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
		{$t('common.docs')}
	</p>
	{#each DOC_NAV as section, sectionIndex (sectionIndex)}
		{#if section.title}
			<p
				class="px-3 pt-4 pb-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider {sectionIndex ===
				0
					? 'pt-0'
					: ''}"
			>
				{section.title}
			</p>
		{/if}
		{#each section.items as doc (doc.slug)}
			{@const Icon = DOC_ICONS[doc.slug] ?? FileText}
			<a
				href="/docs/{doc.slug}"
				aria-current={isActive(doc.slug) ? 'page' : undefined}
				class="group flex items-center justify-between px-3 py-2 rounded-lg transition-colors {isActive(
					doc.slug
				)
					? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
					: 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'}"
				onclick={closeMobileMenu}
			>
				<div class="flex items-center gap-3 min-w-0">
					<Icon class="w-4 h-4 shrink-0" />
					<span class="text-sm font-medium truncate">{doc.title}</span>
				</div>
				{#if isActive(doc.slug)}
					<ChevronRight class="w-3 h-3 shrink-0" />
				{/if}
			</a>
		{/each}
	{/each}

	<div class="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
		<button
			type="button"
			onclick={() => downloadAllDocs($locale || 'en')}
			class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors"
		>
			<Download class="w-4 h-4" />
			{$t('common.download_all')}
		</button>
	</div>
{/snippet}

<svelte:window onkeydown={onKeydown} />

<div class="flex flex-col md:flex-row gap-8">
	<div
		class="sticky top-16 z-30 -mx-4 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
	>
		<button
			type="button"
			class="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
			aria-haspopup="dialog"
			aria-expanded={mobileMenuOpen}
			aria-controls="docs-mobile-menu"
			onclick={openMobileMenu}
		>
			<span class="flex min-w-0 items-center gap-2">
				<CurrentIcon class="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
				<span class="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
					{currentDoc?.title ?? $t('common.docs')}
				</span>
			</span>
			<span
				class="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400"
			>
				<Menu class="h-4 w-4" />
				{$t('common.docs_menu')}
			</span>
		</button>
	</div>

	<aside class="hidden w-full shrink-0 md:block md:w-64">
		<nav class="sticky top-24 space-y-1 max-h-[calc(100dvh-7rem)] overflow-y-auto">
			{@render navContent()}
		</nav>
	</aside>

	{#if mobileMenuOpen}
		<div
			id="docs-mobile-menu"
			class="fixed inset-0 z-50 md:hidden"
			role="dialog"
			aria-modal="true"
			aria-label={$t('common.docs_menu')}
		>
			<button
				type="button"
				class="absolute inset-0 bg-black/50"
				aria-label={$t('common.docs_menu_close')}
				onclick={closeMobileMenu}
			></button>
			<div
				class="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-white shadow-xl dark:bg-zinc-950"
			>
				<div
					class="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800"
				>
					<span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
						{$t('common.docs_menu')}
					</span>
					<button
						type="button"
						class="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
						aria-label={$t('common.docs_menu_close')}
						onclick={closeMobileMenu}
					>
						<X class="h-4 w-4" />
					</button>
				</div>
				<div
					class="min-h-0 flex-1 space-y-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
				>
					{@render navContent()}
				</div>
			</div>
		</div>
	{/if}

	<div class="flex-1 min-w-0">
		{@render children()}
	</div>
</div>
