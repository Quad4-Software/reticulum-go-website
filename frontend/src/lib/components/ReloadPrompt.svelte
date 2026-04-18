<script lang="ts">
	import { useRegisterSW } from 'virtual:pwa-register/svelte';

	const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
		onRegistered(r: ServiceWorkerRegistration | undefined) {
			if (r) {
				setInterval(
					() => {
						void r.update();
					},
					60 * 60 * 1000
				);
			}
		},
		onRegisterError(err: unknown) {
			console.warn('Service worker registration failed', err);
		}
	});

	function close() {
		offlineReady.set(false);
		needRefresh.set(false);
	}
</script>

{#if $offlineReady || $needRefresh}
	<div
		class="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-900 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
		role="status"
	>
		<div class="mb-3 leading-snug">
			{#if $offlineReady}
				<span>App is cached and can be used offline.</span>
			{:else}
				<span>A new version is available, including updates to cached assets.</span>
			{/if}
		</div>
		<div class="flex flex-wrap gap-2">
			{#if $needRefresh}
				<button
					type="button"
					class="rounded-lg bg-cyan-600 px-3 py-1.5 font-medium text-white hover:bg-cyan-500"
					onclick={() => updateServiceWorker(true)}
				>
					Reload
				</button>
			{/if}
			<button
				type="button"
				class="rounded-lg border border-zinc-300 px-3 py-1.5 dark:border-zinc-600"
				onclick={close}
			>
				Dismiss
			</button>
		</div>
	</div>
{/if}
