<script lang="ts">
	let { data } = $props();
</script>

<div class="prose prose-zinc dark:prose-invert max-w-none">
	{#if data.content}
		{#key data.content}
			<data.content />
		{/key}
	{/if}
</div>
