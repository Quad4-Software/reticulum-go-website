<script lang="ts">
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';

	let Reload = $state<Component | null>(null);

	onMount(async () => {
		const m = await import('./ReloadPrompt.svelte');
		Reload = m.default;
	});
</script>

{#if Reload}
	<Reload />
{/if}
