<script lang="ts">
	import { t } from 'svelte-i18n';
	import IconCascade from '$lib/components/IconCascade.svelte';

	const platforms = [
		{ id: 'windows', src: '/platform-icons/windows.svg', nameKey: 'home.platforms.windows' },
		{ id: 'apple', src: '/platform-icons/apple.svg', nameKey: 'home.platforms.apple' },
		{ id: 'android', src: '/platform-icons/android.svg', nameKey: 'home.platforms.android' },
		{ id: 'debian', src: '/platform-icons/debian.svg', nameKey: 'home.platforms.debian' },
		{ id: 'ubuntu', src: '/platform-icons/ubuntu.svg', nameKey: 'home.platforms.ubuntu' },
		{ id: 'fedora', src: '/platform-icons/fedora.svg', nameKey: 'home.platforms.fedora' },
		{ id: 'opensuse', src: '/platform-icons/opensuse.svg', nameKey: 'home.platforms.opensuse' },
		{ id: 'archlinux', src: '/platform-icons/archlinux.svg', nameKey: 'home.platforms.arch' },
		{ id: 'gentoo', src: '/platform-icons/gentoo.svg', nameKey: 'home.platforms.gentoo' },
		{ id: 'nixos', src: '/platform-icons/nixos.svg', nameKey: 'home.platforms.nixos' },
		{ id: 'alpine', src: '/platform-icons/alpine.svg', nameKey: 'home.platforms.alpine' },
		{ id: 'freebsd', src: '/platform-icons/freebsd.svg', nameKey: 'home.platforms.freebsd' },
		{ id: 'openbsd', src: '/platform-icons/openbsd.svg', nameKey: 'home.platforms.openbsd' },
		{ id: 'netbsd', src: '/platform-icons/netbsd.svg', nameKey: 'home.platforms.netbsd' },
		{ id: 'haiku', src: '/platform-icons/haiku.svg', nameKey: 'home.platforms.haiku' },
		{
			id: 'raspberrypi',
			src: '/platform-icons/raspberrypi.svg',
			nameKey: 'home.platforms.raspberry_pi'
		},
		{ id: 'powerpc', src: '/platform-icons/powerpc.svg', nameKey: 'home.platforms.powerpc' },
		{ id: 'flatpak', src: '/platform-icons/flatpak.svg', nameKey: 'home.platforms.flatpak' },
		{ id: 'docker', src: '/platform-icons/docker.svg', nameKey: 'home.platforms.docker' },
		{
			id: 'firecracker',
			src: '/platform-icons/firecracker.svg',
			nameKey: 'home.platforms.firecracker'
		},
		{ id: 'wasm', src: '/platform-icons/wasm.svg', nameKey: 'home.platforms.wasm' }
	] as const;
</script>

<div
	class="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 p-6 pb-10 md:p-8 md:pb-12"
>
	<div class="text-center mb-6 md:mb-8">
		<h2 class="text-lg md:text-xl font-bold tracking-tight">{$t('home.platforms.title')}</h2>
	</div>
	<div class="flex justify-center">
		<IconCascade items={platforms} size="lg" ariaLabelKey="home.platforms.title" />
	</div>
	<p
		class="mt-6 md:mt-8 text-center text-sm tracking-wide text-zinc-500 dark:text-zinc-400 max-w-4xl mx-auto leading-relaxed"
	>
		{$t('home.platforms.list')}
	</p>
	<p
		class="absolute bottom-3 right-4 md:bottom-4 md:right-5 text-[11px] text-zinc-400 dark:text-zinc-500"
	>
		{$t('home.platforms.arches')}
	</p>
</div>
