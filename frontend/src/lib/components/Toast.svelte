<script lang="ts">
	let {
		message = '',
		visible = false,
		showDot = true,
		ondismiss
	}: {
		message?: string;
		visible?: boolean;
		showDot?: boolean;
		ondismiss?: () => void;
	} = $props();
</script>

{#if visible && message}
	<div
		class="toast-pop fixed bottom-5 right-4 z-[100] flex max-w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-white/50 bg-white/75 px-4 py-3.5 text-sm font-semibold leading-snug text-zinc-800 shadow-2xl shadow-black/10 ring-1 ring-black/[0.06] backdrop-blur-xl dark:border-zinc-500/35 dark:bg-zinc-950/78 dark:text-zinc-100 dark:shadow-black/40 dark:ring-white/[0.08] sm:bottom-6 sm:right-6"
		role="status"
	>
		{#if showDot}
			<span
				class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#00ADD8] shadow-[0_0_12px_rgba(0,173,216,0.55)]"
				aria-hidden="true"
				data-testid="toast-dot"
			></span>
		{/if}
		<span class="min-w-0 flex-1">{message}</span>
		{#if ondismiss}
			<button
				type="button"
				class="shrink-0 -mr-1 -mt-0.5 rounded-lg px-1.5 py-0.5 text-xs font-bold text-zinc-400 hover:bg-zinc-200/60 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
				onclick={ondismiss}
				aria-label="Dismiss"
			>
				X
			</button>
		{/if}
	</div>
{/if}
