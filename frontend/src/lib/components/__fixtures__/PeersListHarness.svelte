<script lang="ts">
	import { reticulum } from '$lib/reticulum.svelte';

	const peers = $derived(Array.from(reticulum.peers.values()));
</script>

{#if reticulum.initialized}
	<section data-testid="peers-section">
		{#if peers.length === 0}
			<p data-testid="empty">no peers</p>
		{:else}
			<ul>
				{#each peers as peer (peer.hash)}
					<li data-testid="peer-row" data-hash={peer.hash}>{peer.name}</li>
				{/each}
			</ul>
		{/if}
	</section>
{:else}
	<p data-testid="not-initialized">not initialized</p>
{/if}
