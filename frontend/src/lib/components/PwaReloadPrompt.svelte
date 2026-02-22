<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';
	import { onMount } from 'svelte';

	const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			console.log('SW Registered:', r);
		},
		onRegisterError(error: unknown) {
			console.log('SW registration error', error);
		}
	});

	const close = () => {
		offlineReady.set(false);
		needRefresh.set(false);
	};

	onMount(() => {
		console.log('PWA Reload Prompt mounted');
	});
</script>

{#if $offlineReady || $needRefresh}
	<div
		class="fixed bottom-4 right-4 z-[200] p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-4"
	>
		<div class="flex items-start gap-3">
			<div class="p-2 bg-[#00ADD8]/10 rounded-xl">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="w-5 h-5 text-[#00ADD8]"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-50">
					{#if $offlineReady}
						App ready for offline use
					{:else}
						Update available!
					{/if}
				</h3>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
					{#if $offlineReady}
						The app is now cached and available offline.
					{:else}
						A new version is available. Reload to update?
					{/if}
				</p>
			</div>
		</div>

		<div class="flex gap-2 justify-end">
			<button
				onclick={close}
				class="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
			>
				Close
			</button>
			{#if $needRefresh}
				<button
					onclick={() => updateServiceWorker(true)}
					class="px-4 py-1.5 bg-[#00ADD8] hover:bg-[#009dc4] text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-[#00ADD8]/20"
				>
					Reload
				</button>
			{/if}
		</div>
	</div>
{/if}
