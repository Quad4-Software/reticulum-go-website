<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
	<div class="space-y-2">
		<h1 class="text-8xl font-black text-zinc-200 dark:text-zinc-800">
			{page.status}
		</h1>
		<p class="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
			{page.error?.message || 'Something went wrong'}
		</p>
	</div>

	<p class="max-w-md text-zinc-500">
		The page you are looking for might have been moved, deleted, or never existed in the first
		place.
	</p>

	<a
		href="/"
		class="px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl transition-transform active:scale-95"
	>
		Back to Home
	</a>
</div>
