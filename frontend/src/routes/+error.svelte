<script lang="ts">
	import { page } from '$app/state';
	import { Home, BookOpen, Cpu, Mail } from 'lucide-svelte';

	const navLinks = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/docs', label: 'Documentation', icon: BookOpen },
		{ href: '/wasm-example', label: 'WASM Demo', icon: Cpu },
		{ href: '/contact', label: 'Contact', icon: Mail }
	];
</script>

<svelte:head>
	<title>{page.status} | Reticulum-Go</title>
</svelte:head>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto">
	<div class="space-y-2">
		<h1 class="text-8xl font-black text-zinc-200 dark:text-zinc-800">
			{page.status}
		</h1>
		<p class="text-xl font-semibold text-zinc-600 dark:text-zinc-400">
			{page.error?.message || 'Something went wrong'}
		</p>
	</div>

	<p class="text-zinc-500">
		The page you are looking for might have been moved, deleted, or never existed in the first
		place.
	</p>

	<div class="flex flex-wrap justify-center gap-3">
		{#each navLinks as item (item.href)}
			<a
				href={item.href}
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
			>
				<svelte:component this={item.icon} class="w-4 h-4" />
				{item.label}
			</a>
		{/each}
	</div>

	<a
		href="/docs"
		class="inline-flex items-center gap-2 px-8 py-3 bg-[#00ADD8] text-white font-bold rounded-xl hover:bg-[#00ADD8]/90 transition-colors"
	>
		<BookOpen class="w-5 h-5" />
		Search Documentation
	</a>
</div>
