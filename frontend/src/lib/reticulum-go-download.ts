export const RETICULUM_GO_RELEASES_REPO = 'https://github.com/Quad4-Software/Reticulum-Go';

export type RgAsset = {
	name: string;
	url: string;
	size: number;
	contentType: string;
};

export type RgRelease = {
	tag: string;
	name: string;
	publishedAt: string;
	prerelease: boolean;
	htmlUrl: string;
	assets: RgAsset[];
};

export type RgReleasesSnapshot = {
	stable: RgRelease | null;
	nightly: RgRelease | null;
	fetchedAt: string;
};

export type SlotVisibility = 'always' | 'when_available';

export type RgDownloadSlotId =
	| 'windows_amd64'
	| 'windows_arm64'
	| 'windows_386'
	| 'windows_7'
	| 'windows_xp'
	| 'linux_amd64'
	| 'linux_arm64'
	| 'linux_arm'
	| 'linux_386'
	| 'linux_riscv64'
	| 'macos_arm'
	| 'macos_intel'
	| 'freebsd'
	| 'wasm';

export type RgDownloadSlot = {
	id: RgDownloadSlotId;
	icon: string;
	titleKey: string;
	hintKey: string;
	primary: string;
	alternates: readonly string[];
	visibility?: SlotVisibility;
};

export const RG_DOWNLOAD_SLOTS: readonly RgDownloadSlot[] = [
	{
		id: 'windows_amd64',
		icon: '/platform-icons/windows11.svg',
		titleKey: 'reticulum_download.slots.windows_amd64.title',
		hintKey: 'reticulum_download.slots.windows_amd64.hint',
		primary: 'reticulum-go-windows-amd64.exe',
		alternates: []
	},
	{
		id: 'windows_arm64',
		icon: '/platform-icons/windows11.svg',
		titleKey: 'reticulum_download.slots.windows_arm64.title',
		hintKey: 'reticulum_download.slots.windows_arm64.hint',
		primary: 'reticulum-go-windows-arm64.exe',
		alternates: []
	},
	{
		id: 'windows_386',
		icon: '/platform-icons/windows10.svg',
		titleKey: 'reticulum_download.slots.windows_386.title',
		hintKey: 'reticulum_download.slots.windows_386.hint',
		primary: 'reticulum-go-windows-386.exe',
		alternates: [],
		visibility: 'when_available'
	},
	{
		id: 'windows_7',
		icon: '/platform-icons/windows7.svg',
		titleKey: 'reticulum_download.slots.windows_7.title',
		hintKey: 'reticulum_download.slots.windows_7.hint',
		primary: 'reticulum-go-windows-amd64-win7.exe',
		alternates: ['reticulum-go-windows-arm64-win7.exe'],
		visibility: 'when_available'
	},
	{
		id: 'windows_xp',
		icon: '/platform-icons/windowsxp.svg',
		titleKey: 'reticulum_download.slots.windows_xp.title',
		hintKey: 'reticulum_download.slots.windows_xp.hint',
		primary: 'reticulum-go-windows-386-winxp.exe',
		alternates: ['reticulum-go-windows-amd64-winxp.exe'],
		visibility: 'when_available'
	},
	{
		id: 'linux_amd64',
		icon: '/platform-icons/ubuntu.svg',
		titleKey: 'reticulum_download.slots.linux_amd64.title',
		hintKey: 'reticulum_download.slots.linux_amd64.hint',
		primary: 'reticulum-go-linux-amd64',
		alternates: []
	},
	{
		id: 'linux_arm64',
		icon: '/platform-icons/raspberrypi.svg',
		titleKey: 'reticulum_download.slots.linux_arm64.title',
		hintKey: 'reticulum_download.slots.linux_arm64.hint',
		primary: 'reticulum-go-linux-arm64',
		alternates: []
	},
	{
		id: 'linux_arm',
		icon: '/platform-icons/raspberrypi.svg',
		titleKey: 'reticulum_download.slots.linux_arm.title',
		hintKey: 'reticulum_download.slots.linux_arm.hint',
		primary: 'reticulum-go-linux-arm',
		alternates: []
	},
	{
		id: 'linux_386',
		icon: '/platform-icons/ubuntu.svg',
		titleKey: 'reticulum_download.slots.linux_386.title',
		hintKey: 'reticulum_download.slots.linux_386.hint',
		primary: 'reticulum-go-linux-386',
		alternates: [],
		visibility: 'when_available'
	},
	{
		id: 'linux_riscv64',
		icon: '/platform-icons/riscv.svg',
		titleKey: 'reticulum_download.slots.linux_riscv64.title',
		hintKey: 'reticulum_download.slots.linux_riscv64.hint',
		primary: 'reticulum-go-linux-riscv64',
		alternates: [],
		visibility: 'when_available'
	},
	{
		id: 'macos_arm',
		icon: '/platform-icons/apple.svg',
		titleKey: 'reticulum_download.slots.macos_arm.title',
		hintKey: 'reticulum_download.slots.macos_arm.hint',
		primary: 'reticulum-go-darwin-arm64',
		alternates: []
	},
	{
		id: 'macos_intel',
		icon: '/platform-icons/apple.svg',
		titleKey: 'reticulum_download.slots.macos_intel.title',
		hintKey: 'reticulum_download.slots.macos_intel.hint',
		primary: 'reticulum-go-darwin-amd64',
		alternates: []
	},
	{
		id: 'freebsd',
		icon: '/platform-icons/freebsd.svg',
		titleKey: 'reticulum_download.slots.freebsd.title',
		hintKey: 'reticulum_download.slots.freebsd.hint',
		primary: 'reticulum-go-freebsd-amd64',
		alternates: [
			'reticulum-go-freebsd-arm64',
			'reticulum-go-freebsd-arm',
			'reticulum-go-freebsd-386',
			'reticulum-go-freebsd-riscv64'
		]
	},
	{
		id: 'wasm',
		icon: '/platform-icons/wasm.svg',
		titleKey: 'reticulum_download.slots.wasm.title',
		hintKey: 'reticulum_download.slots.wasm.hint',
		primary: 'reticulum-go-js-wasm.wasm',
		alternates: ['reticulum-go-example-wasm.wasm']
	}
] as const;

const EXAMPLE_PREFIX = 'reticulum-go-example-';
const SBOM_PREFIX = 'reticulum-go-sbom.';

const RG_SLOT_PREFIX: Record<RgDownloadSlotId, RegExp> = {
	windows_amd64: /^reticulum-go-windows-amd64\.exe$/,
	windows_arm64: /^reticulum-go-windows-arm64\.exe$/,
	windows_386: /^reticulum-go-windows-386\.exe$/,
	windows_7: /^reticulum-go-windows-(amd64|arm64)-win7\.exe$/,
	windows_xp: /^reticulum-go-windows-(386|amd64)-winxp\.exe$/,
	linux_amd64: /^reticulum-go-linux-amd64$/,
	linux_arm64: /^reticulum-go-linux-arm64$/,
	linux_arm: /^reticulum-go-linux-arm$/,
	linux_386: /^reticulum-go-linux-386$/,
	linux_riscv64: /^reticulum-go-linux-riscv64$/,
	macos_arm: /^reticulum-go-darwin-arm64$/,
	macos_intel: /^reticulum-go-darwin-amd64$/,
	freebsd: /^reticulum-go-freebsd-/,
	wasm: /^reticulum-go-(js-wasm|example-wasm)/
};

function assetsForPrefix(assets: readonly RgAsset[], prefix: RegExp): RgAsset[] {
	return assets.filter((asset) => prefix.test(asset.name)).sort((a, b) => a.name.localeCompare(b.name));
}

export function formatDownloadSize(bytes: number): string {
	if (bytes <= 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'] as const;
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** index;
	return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function isDownloadableAssetName(name: string): boolean {
	return !name.endsWith('.cosign.bundle');
}

export function findAsset(assets: readonly RgAsset[], name: string): RgAsset | undefined {
	return assets.find((asset) => asset.name === name);
}

export function slotAssets(
	release: RgRelease | null,
	slot: RgDownloadSlot
): { primary: RgAsset | null; alternates: RgAsset[] } {
	if (!release) {
		return { primary: null, alternates: [] };
	}

	const matched = assetsForPrefix(release.assets, RG_SLOT_PREFIX[slot.id]);
	const primary = findAsset(release.assets, slot.primary) ?? matched[0] ?? null;
	const alternates = matched.filter((asset) => asset.name !== primary?.name);

	return { primary, alternates };
}

export function slotHasAssets(release: RgRelease | null, slot: RgDownloadSlot): boolean {
	const picked = slotAssets(release, slot);
	return picked.primary !== null || picked.alternates.length > 0;
}

export function slotsForRelease(
	release: RgRelease | null,
	slots: readonly RgDownloadSlot[] = RG_DOWNLOAD_SLOTS
): RgDownloadSlot[] {
	return slots.filter(
		(slot) => slot.visibility !== 'when_available' || slotHasAssets(release, slot)
	);
}

export function findExampleAssets(release: RgRelease | null): RgAsset[] {
	if (!release) return [];
	return release.assets
		.filter(
			(asset) =>
				asset.name.startsWith(EXAMPLE_PREFIX) &&
				isDownloadableAssetName(asset.name) &&
				!asset.name.endsWith('.wasm')
		)
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function findSbomAssets(release: RgRelease | null): RgAsset[] {
	if (!release) return [];
	return release.assets
		.filter((asset) => asset.name.startsWith(SBOM_PREFIX) && isDownloadableAssetName(asset.name))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function detectClientPlatform(ua: string): RgDownloadSlotId | 'unknown' {
	const s = ua.toLowerCase();
	if (/windows/.test(s)) {
		if (/arm64|aarch64/.test(s)) return 'windows_arm64';
		if (/win64|x64|wow64/.test(s)) return 'windows_amd64';
		return 'windows_386';
	}
	if (/mac os x|macintosh/.test(s)) {
		if (/arm64|aarch64|macintosh;\s*arm/i.test(s)) return 'macos_arm';
		return 'macos_intel';
	}
	if (/freebsd/.test(s)) return 'freebsd';
	if (/linux|x11/.test(s)) {
		if (/riscv64/.test(s)) return 'linux_riscv64';
		if (/aarch64|arm64/.test(s)) return 'linux_arm64';
		if (/armv[67]|armv6|armv7/.test(s)) return 'linux_arm';
		if (/\bi686\b|i386|linux i[36]86/.test(s)) return 'linux_386';
		return 'linux_amd64';
	}
	return 'unknown';
}
