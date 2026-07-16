<script lang="ts">
	import { onMount } from 'svelte';
	import { isDark, initTheme, applyDarkClass, type Theme } from '$lib/theme';

	let { children, currentTheme = 'system' as Theme } = $props();

	onMount(() => {
		initTheme(currentTheme);
		const unsub = isDark.subscribe(applyDarkClass);
		return unsub;
	});
</script>

{@render children()}
