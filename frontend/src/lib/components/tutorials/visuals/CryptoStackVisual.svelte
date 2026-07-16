<script lang="ts">
	let { activeLayer = 0 }: { activeLayer?: number } = $props();

	const layers = [
		{ id: 'identity-keys', label: 'Identity keys', hint: 'X25519 + Ed25519' },
		{ id: 'ecdh-hkdf', label: 'ECDH / HKDF', hint: 'Ephemeral key agreement, key expansion' },
		{
			id: 'aes-hmac',
			label: 'AES-256-CBC + HMAC-SHA256',
			hint: 'Encrypt and authenticate ciphertext'
		},
		{ id: 'wire-token', label: 'Wire token', hint: 'On-wire identity ciphertext' }
	];

	const focus = $derived(Math.min(activeLayer, layers.length - 1));
</script>

<div class="mx-auto flex max-w-md flex-col items-stretch gap-2">
	{#each layers as layer, index (layer.id)}
		<div class="flex flex-col items-center gap-2">
			<div
				class="w-full rounded-xl border px-4 py-3 text-center transition-colors {index === focus
					? 'border-[#00ADD8] bg-[#00ADD8]/10'
					: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}"
			>
				<p
					class="text-sm font-semibold {index === focus
						? 'text-[#00ADD8]'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{layer.label}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{layer.hint}</p>
			</div>
			{#if index < layers.length - 1}
				<svg class="h-4 w-4 text-[#00ADD8]" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path
						d="M10 3v14m0 0-4-4m4 4 4-4"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			{/if}
		</div>
	{/each}
</div>
