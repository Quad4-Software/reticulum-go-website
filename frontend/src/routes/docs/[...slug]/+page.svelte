<script lang="ts">
	import { locale } from 'svelte-i18n';
	let { data } = $props();
</script>

<div class="prose prose-zinc dark:prose-invert max-w-none">
	{#if data.content}
		{#key `${$locale}-${data.content}`}
			<data.content />
		{/key}
	{/if}
</div>
