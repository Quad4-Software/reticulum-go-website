<script lang="ts">
	import { asset } from '$lib/cdn';
	import IconCascade from '$lib/components/IconCascade.svelte';

	const browsers = [
		{
			id: 'chrome',
			src: asset('/browser-icons/chrome.svg'),
			nameKey: 'tools.rnode_flasher.browser_chrome'
		},
		{ id: 'edge', src: asset('/browser-icons/edge.svg'), nameKey: 'tools.rnode_flasher.browser_edge' },
		{ id: 'brave', src: asset('/browser-icons/brave.svg'), nameKey: 'tools.rnode_flasher.browser_brave' },
		{ id: 'opera', src: asset('/browser-icons/opera.svg'), nameKey: 'tools.rnode_flasher.browser_opera' }
	] as const;
</script>

<IconCascade items={browsers} labelKey="tools.rnode_flasher.supported_browsers" />
