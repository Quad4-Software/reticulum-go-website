<script lang="ts">
	import { onMount } from 'svelte';
	import { isDark, initTheme, applyDarkClass } from '$lib/theme';

	let { children } = $props();

	onMount(() => {
		initTheme();
		const unsub = isDark.subscribe(applyDarkClass);
		return unsub;
	});
</script>

{@render children()}
