<script lang="ts">
	import { t } from 'svelte-i18n';
	import { Copy, Check, ExternalLink } from 'lucide-svelte';
	import Toast from '$lib/components/Toast.svelte';

	const LXMF = 'f489752fbef161c64d65e385a4e9fc74';
	const EMAIL = 'team@quad4.io';

	let toastMessage = $state('');
	let toastVisible = $state(false);
	let toastTimer: ReturnType<typeof setTimeout> | null = null;
	let copiedKey = $state<string | null>(null);

	function showToast(message: string) {
		toastMessage = message;
		toastVisible = true;
		if (toastTimer) clearTimeout(toastTimer);
		toastTimer = setTimeout(() => {
			toastVisible = false;
			toastTimer = null;
		}, 2500);
	}

	async function copyText(key: string, value: string) {
		try {
			await navigator.clipboard.writeText(value);
			copiedKey = key;
			showToast($t('contact.copied_toast'));
			setTimeout(() => {
				if (copiedKey === key) copiedKey = null;
			}, 1500);
		} catch {
			showToast($t('contact.copy_failed'));
		}
	}
</script>

<svelte:head>
	<title>{$t('contact.title')} | Reticulum-Go</title>
	<meta name="description" content={$t('contact.meta_description')} />
</svelte:head>

<div class="max-w-3xl mx-auto space-y-12">
	<div class="text-center space-y-4">
		<h1 class="text-4xl font-bold">{$t('contact.title')}</h1>
		<p class="text-xl text-zinc-600 dark:text-zinc-400">
			{$t('contact.subtitle')}
		</p>
	</div>

	<div class="grid gap-8">
		<div
			class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-6"
		>
			<h2 class="text-2xl font-bold border-b border-zinc-200 dark:border-zinc-800 pb-2">
				{$t('contact.dev_heading')}
			</h2>

			<div class="space-y-4">
				<div class="space-y-1">
					<div
						class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider"
					>
						<span class="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">01</span>
						{$t('contact.lxmf_label')}
					</div>
					<button
						type="button"
						onclick={() => copyText('lxmf', LXMF)}
						class="group flex w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left transition hover:border-[#00ADD8]/50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-[#00ADD8]/40"
						aria-label={$t('contact.copy_lxmf')}
					>
						<code class="min-w-0 flex-1 break-all font-mono text-sm text-zinc-800 dark:text-zinc-200"
							>{LXMF}</code
						>
						<span class="text-zinc-400 opacity-0 transition group-hover:opacity-100" aria-hidden="true">
							{#if copiedKey === 'lxmf'}
								<Check class="h-4 w-4 text-[#00ADD8]" />
							{:else}
								<Copy class="h-4 w-4" />
							{/if}
						</span>
					</button>
				</div>

				<div class="space-y-1">
					<div
						class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-wider"
					>
						<span class="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">02</span>
						{$t('contact.email_label')}
					</div>
					<a
						href={`mailto:${EMAIL}`}
						class="inline-flex text-lg font-medium text-[#00ADD8] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded"
					>
						{EMAIL}
					</a>
				</div>
			</div>
		</div>

		<div
			class="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-4"
		>
			<h2 class="text-xl font-bold">{$t('contact.quad4_heading')}</h2>
			<p class="text-zinc-500 dark:text-zinc-400">
				{$t('contact.quad4_body')}
			</p>
			<a
				href="https://quad4.io"
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 text-[#00ADD8] font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00ADD8] rounded"
			>
				{$t('contact.visit_quad4')}
				<ExternalLink class="h-4 w-4" />
			</a>
		</div>
	</div>
</div>

<Toast
	message={toastMessage}
	visible={toastVisible}
	showDot={false}
	ondismiss={() => {
		toastVisible = false;
	}}
/>
