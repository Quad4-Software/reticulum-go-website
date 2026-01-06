<script lang="ts">
	import { Check } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { message = '', duration = 3000 } = $props();
	let visible = $state(false);

	onMount(() => {
		visible = true;
		const timer = setTimeout(() => {
			visible = false;
		}, duration);
		return () => clearTimeout(timer);
	});
</script>

{#if visible}
	<div
		class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-[#00ADD8]/90 backdrop-blur-sm text-white font-bold rounded-full shadow-lg flex items-center gap-2"
	>
		<Check class="w-5 h-5" />
		<span>{message}</span>
	</div>
{/if}

