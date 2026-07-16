<script lang="ts">
	let { activeLayer = 0 }: { activeLayer?: number } = $props();

	const layers = [
		{
			id: 'identity-keys',
			label: 'Identity keys',
			hint: 'X25519 + Ed25519'
		},
		{
			id: 'ecdh-hkdf',
			label: 'ECDH / HKDF',
			hint: 'Ephemeral key agreement, key expansion'
		},
		{
			id: 'aes-hmac',
			label: 'AES-256-CBC + HMAC-SHA256',
			hint: 'Encrypt and authenticate ciphertext'
		},
		{
			id: 'wire-token',
			label: 'Wire token',
			hint: 'On-wire identity ciphertext'
		}
	];
</script>

<div class="flex flex-col items-stretch gap-2 max-w-md mx-auto">
	{#each layers as layer, index (layer.id)}
		<div class="flex flex-col items-center gap-2">
			<div
				class="w-full rounded-xl border px-4 py-3 text-center transition-all duration-300 {index ===
				activeLayer
					? 'border-[#00ADD8] bg-[#00ADD8]/10 shadow-sm scale-[1.02]'
					: 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 opacity-85'}"
			>
				<p
					class="text-sm font-semibold {index === activeLayer
						? 'text-[#00ADD8]'
						: 'text-zinc-900 dark:text-zinc-100'}"
				>
					{layer.label}
				</p>
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{layer.hint}</p>
			</div>

			{#if index < layers.length - 1}
				<svg
					class="h-4 w-4 text-[#00ADD8] transition-opacity duration-300 {index === activeLayer
						? 'opacity-100'
						: 'opacity-50'}"
					viewBox="0 0 20 20"
					fill="none"
					aria-hidden="true"
				>
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
