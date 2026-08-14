import { formatDownloadSize, isDownloadableAssetName } from '$lib/download-utils';

export { formatDownloadSize };

export const REN_BROWSER_REPO = 'https://github.com/Quad4-Software/Ren-Browser';
export const REN_BROWSER_DOCKER =
	'https://github.com/Quad4-Software/Ren-Browser/pkgs/container/renbrowser';
export const REN_BROWSER_DOCS = `${REN_BROWSER_REPO}/tree/master/docs/en`;

export type RenBrowserAsset = {
	name: string;
	url: string;
	size: number;
	contentType: string;
};

export type RenBrowserRelease = {
	tag: string;
	name: string;
	publishedAt: string;
	prerelease: boolean;
	htmlUrl: string;
	assets: RenBrowserAsset[];
};

export type RenBrowserReleasesSnapshot = {
	stable: RenBrowserRelease | null;
	nightly: RenBrowserRelease | null;
	fetchedAt: string;
};

export type SlotVisibility = 'always' | 'when_available';

export type DownloadSlotId =
	| 'windows'
	| 'windows_7'
	| 'windows_xp'
	| 'windows_386'
	| 'linux_amd64'
	| 'linux_386'
	| 'linux_riscv64'
	| 'linux_arm64'
	| 'macos'
	| 'android'
	| 'ios'
	| 'server';

export type DownloadSlot = {
	id: DownloadSlotId;
	icon: string;
	titleKey: string;
	hintKey: string;
	primary: string;
	alternates: readonly string[];
	visibility?: SlotVisibility;
};

export const DOWNLOAD_SLOTS: readonly DownloadSlot[] = [
	{
		id: 'windows',
		icon: '/platform-icons/windows11.svg',
		titleKey: 'ren_browser.downloads.slots.windows.title',
		hintKey: 'ren_browser.downloads.slots.windows.hint',
		primary: 'renbrowser-windows-amd64-installer.exe',
		alternates: ['renbrowser-windows-amd64.exe', 'renbrowser-windows-amd64.msix']
	},
	{
		id: 'windows_7',
		icon: '/platform-icons/windows7.svg',
		titleKey: 'ren_browser.downloads.slots.windows_7.title',
		hintKey: 'ren_browser.downloads.slots.windows_7.hint',
		primary: 'renbrowser-windows-amd64-win7-installer.exe',
		alternates: ['renbrowser-windows-amd64-win7.exe'],
		visibility: 'when_available'
	},
	{
		id: 'windows_xp',
		icon: '/platform-icons/windowsxp.svg',
		titleKey: 'ren_browser.downloads.slots.windows_xp.title',
		hintKey: 'ren_browser.downloads.slots.windows_xp.hint',
		primary: 'renbrowser-windows-386-winxp.exe',
		alternates: [
			'renbrowser-windows-amd64-winxp.exe',
			'renbrowser-windows-amd64-winxp-installer.exe'
		],
		visibility: 'when_available'
	},
	{
		id: 'windows_386',
		icon: '/platform-icons/windows10.svg',
		titleKey: 'ren_browser.downloads.slots.windows_386.title',
		hintKey: 'ren_browser.downloads.slots.windows_386.hint',
		primary: 'renbrowser-windows-386-installer.exe',
		alternates: ['renbrowser-windows-386.exe'],
		visibility: 'when_available'
	},
	{
		id: 'linux_amd64',
		icon: '/platform-icons/ubuntu.svg',
		titleKey: 'ren_browser.downloads.slots.linux_amd64.title',
		hintKey: 'ren_browser.downloads.slots.linux_amd64.hint',
		primary: 'renbrowser-linux-amd64.AppImage',
		alternates: [
			'renbrowser-linux-amd64.deb',
			'renbrowser-linux-amd64.rpm',
			'renbrowser-linux-amd64.flatpak',
			'renbrowser-linux-amd64.pkg.tar.zst',
			'renbrowser-linux-amd64'
		]
	},
	{
		id: 'linux_386',
		icon: '/platform-icons/ubuntu.svg',
		titleKey: 'ren_browser.downloads.slots.linux_386.title',
		hintKey: 'ren_browser.downloads.slots.linux_386.hint',
		primary: 'renbrowser-linux-386.AppImage',
		alternates: [
			'renbrowser-linux-386.deb',
			'renbrowser-linux-386.rpm',
			'renbrowser-linux-386.flatpak',
			'renbrowser-linux-386.pkg.tar.zst',
			'renbrowser-linux-386'
		],
		visibility: 'when_available'
	},
	{
		id: 'linux_riscv64',
		icon: '/platform-icons/riscv.svg',
		titleKey: 'ren_browser.downloads.slots.linux_riscv64.title',
		hintKey: 'ren_browser.downloads.slots.linux_riscv64.hint',
		primary: 'renbrowser-linux-riscv64.AppImage',
		alternates: [
			'renbrowser-linux-riscv64.deb',
			'renbrowser-linux-riscv64.rpm',
			'renbrowser-linux-riscv64.pkg.tar.zst',
			'renbrowser-linux-riscv64',
			'renbrowser-server-linux-riscv64'
		],
		visibility: 'when_available'
	},
	{
		id: 'linux_arm64',
		icon: '/platform-icons/raspberrypi.svg',
		titleKey: 'ren_browser.downloads.slots.linux_arm64.title',
		hintKey: 'ren_browser.downloads.slots.linux_arm64.hint',
		primary: 'renbrowser-linux-arm64.AppImage',
		alternates: [
			'renbrowser-linux-arm64.deb',
			'renbrowser-linux-arm64.rpm',
			'renbrowser-linux-arm64.pkg.tar.zst',
			'renbrowser-linux-arm64'
		]
	},
	{
		id: 'macos',
		icon: '/platform-icons/apple.svg',
		titleKey: 'ren_browser.downloads.slots.macos.title',
		hintKey: 'ren_browser.downloads.slots.macos.hint',
		primary: 'renbrowser-macos-universal.zip',
		alternates: []
	},
	{
		id: 'android',
		icon: '/platform-icons/android.svg',
		titleKey: 'ren_browser.downloads.slots.android.title',
		hintKey: 'ren_browser.downloads.slots.android.hint',
		primary: 'renbrowser-android-universal.apk',
		alternates: []
	},
	{
		id: 'ios',
		icon: '/platform-icons/apple.svg',
		titleKey: 'ren_browser.downloads.slots.ios.title',
		hintKey: 'ren_browser.downloads.slots.ios.hint',
		primary: 'renbrowser-ios.ipa',
		alternates: []
	},
	{
		id: 'server',
		icon: '/platform-icons/docker.svg',
		titleKey: 'ren_browser.downloads.slots.server.title',
		hintKey: 'ren_browser.downloads.slots.server.hint',
		primary: 'renbrowser-server-linux-amd64',
		alternates: [
			'renbrowser-server-linux-arm64',
			'renbrowser-server-linux-armv6',
			'renbrowser-server-linux-riscv64',
			'renbrowser-server-windows-amd64.exe',
			'renbrowser-server-windows7-amd64.exe',
			'renbrowser-server-freebsd-amd64',
			'renbrowser-server-freebsd-arm64',
			'renbrowser-server-openbsd-amd64',
			'renbrowser-server-netbsd-amd64'
		]
	}
] as const;

const EXTRA_WASM_PREFIX = /^renbrowser-micron-translator/;
const SBOM_PREFIX = 'renbrowser-sbom.';

const SLOT_ASSET_PREFIX: Record<DownloadSlotId, RegExp> = {
	windows: /^renbrowser-windows-amd64(?!-(win7|winxp))/,
	windows_7: /^renbrowser-windows-amd64-win7/,
	windows_xp: /^renbrowser-windows-(386|amd64)-winxp/,
	windows_386: /^renbrowser-windows-386(?!-winxp)/,
	linux_amd64: /^renbrowser-linux-amd64/,
	linux_386: /^renbrowser-linux-386/,
	linux_riscv64: /^renbrowser-(linux-riscv64|server-linux-riscv64)/,
	linux_arm64: /^renbrowser-linux-arm64/,
	macos: /^renbrowser-macos-/,
	android: /^renbrowser-android-/,
	ios: /^renbrowser-ios/,
	server: /^renbrowser-server-(?!linux-riscv64)/
};

function assetsForPrefix(assets: readonly RenBrowserAsset[], prefix: RegExp): RenBrowserAsset[] {
	return assets
		.filter((asset) => prefix.test(asset.name))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function findAsset(
	assets: readonly RenBrowserAsset[],
	name: string
): RenBrowserAsset | undefined {
	return assets.find((asset) => asset.name === name);
}

export function slotAssets(
	release: RenBrowserRelease | null,
	slot: DownloadSlot
): { primary: RenBrowserAsset | null; alternates: RenBrowserAsset[] } {
	if (!release) {
		return { primary: null, alternates: [] };
	}

	const matched = assetsForPrefix(release.assets, SLOT_ASSET_PREFIX[slot.id]);
	const primary = findAsset(release.assets, slot.primary) ?? matched[0] ?? null;
	const alternates = matched.filter((asset) => asset.name !== primary?.name);

	return { primary, alternates };
}

export function slotHasAssets(release: RenBrowserRelease | null, slot: DownloadSlot): boolean {
	const picked = slotAssets(release, slot);
	return picked.primary !== null || picked.alternates.length > 0;
}

export function slotsForRelease(
	release: RenBrowserRelease | null,
	slots: readonly DownloadSlot[] = DOWNLOAD_SLOTS
): DownloadSlot[] {
	return slots.filter(
		(slot) => slot.visibility !== 'when_available' || slotHasAssets(release, slot)
	);
}

export function findExtraWasmAssets(release: RenBrowserRelease | null): RenBrowserAsset[] {
	if (!release) return [];
	return release.assets
		.filter((asset) => EXTRA_WASM_PREFIX.test(asset.name) && isDownloadableAssetName(asset.name))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function findSbomAssets(release: RenBrowserRelease | null): RenBrowserAsset[] {
	if (!release) return [];
	return release.assets
		.filter((asset) => asset.name.startsWith(SBOM_PREFIX) && isDownloadableAssetName(asset.name))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export function detectClientPlatform(ua: string): DownloadSlotId | 'unknown' {
	const s = ua.toLowerCase();
	if (/android/.test(s)) return 'android';
	if (/iphone|ipad|ipod/.test(s)) return 'ios';
	if (/windows/.test(s)) {
		if (/arm64|aarch64/.test(s)) return 'windows';
		if (/win64|x64|wow64/.test(s)) return 'windows';
		return 'windows_386';
	}
	if (/mac os x|macintosh/.test(s)) return 'macos';
	if (/linux|x11/.test(s)) {
		if (/riscv64/.test(s)) return 'linux_riscv64';
		if (/aarch64|arm64|armv8/.test(s)) return 'linux_arm64';
		if (/\bi686\b|i386|linux i[36]86/.test(s)) return 'linux_386';
		return 'linux_amd64';
	}
	if (/freebsd|openbsd|netbsd/.test(s)) return 'server';
	return 'unknown';
}

export function findChecksumAsset(release: RenBrowserRelease | null): RenBrowserAsset | null {
	return release ? (findAsset(release.assets, 'SHA256SUMS.txt') ?? null) : null;
}
