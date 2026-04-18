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
		class="toast-pop fixed bottom-5 right-4 z-[100] max-w-sm rounded-2xl border border-white/50 bg-white/75 p-4 text-sm text-zinc-800 shadow-2xl shadow-black/10 ring-1 ring-black/[0.06] backdrop-blur-xl dark:border-zinc-500/35 dark:bg-zinc-950/78 dark:text-zinc-100 dark:shadow-black/40 dark:ring-white/[0.08] sm:bottom-6 sm:right-6"
		role="status"
	>
		<div class="mb-3 flex gap-3 leading-snug">
			<span
				class="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#00ADD8] shadow-[0_0_12px_rgba(0,173,216,0.55)]"
				aria-hidden="true"
			></span>
			<div class="min-w-0 flex-1">
			{#if $offlineReady}
				<span>App is cached and can be used offline.</span>
			{:else}
				<span>A new version is available, including updates to cached assets.</span>
			{/if}
			</div>
		</div>
		<div class="flex flex-wrap gap-2 pl-5">
			{#if $needRefresh}
				<button
					type="button"
					class="rounded-lg bg-[#00ADD8] px-3 py-1.5 font-medium text-white shadow-sm shadow-[#00ADD8]/25 hover:bg-[#009dc4]"
					onclick={() => updateServiceWorker(true)}
				>
					Reload
				</button>
			{/if}
			<button
				type="button"
				class="rounded-lg border border-zinc-300/90 bg-white/60 px-3 py-1.5 backdrop-blur-sm dark:border-zinc-500/50 dark:bg-zinc-800/60"
				onclick={close}
			>
				Dismiss
			</button>
		</div>
	</div>
{/if}
