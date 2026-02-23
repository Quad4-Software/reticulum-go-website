<script lang="ts">
	let { class: className = '', lines = 1, height = '1rem' } = $props();
</script>

<div class="space-y-2 {className}">
	{#each Array(lines) as _, i (i)}
		<div
			class="rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"
			style="height: {height};"
		></div>
	{/each}
</div>
