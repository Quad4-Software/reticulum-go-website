import { describe, it, expect } from 'vitest';
import {
	DOWNLOAD_SLOTS,
	detectClientPlatform,
	slotAssets,
	slotsForRelease,
	findExtraWasmAssets,
	findSbomAssets,
	formatDownloadSize,
	type RenBrowserRelease
} from '$lib/ren-browser-download';

const sampleRelease: RenBrowserRelease = {
	tag: 'v0.2.1',
	name: 'Ren Browser 0.2.1',
	publishedAt: '2026-07-27T12:08:53Z',
	prerelease: false,
	htmlUrl: 'https://github.com/Quad4-Software/Ren-Browser/releases/tag/v0.2.1',
	assets: [
		{
			name: 'renbrowser-windows-amd64-installer.exe',
			url: 'https://example.com/installer.exe',
			size: 13_967_116,
			contentType: 'application/octet-stream'
		},
		{
			name: 'renbrowser-linux-amd64.AppImage',
			url: 'https://example.com/appimage',
			size: 90_733_048,
			contentType: 'application/octet-stream'
		},
		{
			name: 'renbrowser-server-linux-amd64',
			url: 'https://example.com/server',
			size: 32_034_978,
			contentType: 'application/octet-stream'
		},
		{
			name: 'renbrowser-server-freebsd-amd64',
			url: 'https://example.com/freebsd',
			size: 31_273_132,
			contentType: 'application/octet-stream'
		}
	]
};

describe('detectClientPlatform', () => {
	it('detects common desktop and mobile user agents', () => {
		expect(
			detectClientPlatform(
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
			)
		).toBe('windows');
		expect(
			detectClientPlatform('Mozilla/5.0 (Windows NT 5.1; rv:52.0) Gecko/20100101 Firefox/52.0')
		).toBe('windows_386');
		expect(
			detectClientPlatform('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0')
		).toBe('linux_amd64');
		expect(
			detectClientPlatform('Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 Chrome/120.0.0.0')
		).toBe('linux_386');
		expect(
			detectClientPlatform('Mozilla/5.0 (X11; Linux riscv64) AppleWebKit/537.36 Chrome/120.0.0.0')
		).toBe('linux_riscv64');
		expect(
			detectClientPlatform('Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/120.0.0.0')
		).toBe('linux_arm64');
		expect(
			detectClientPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15')
		).toBe('macos');
		expect(
			detectClientPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile')
		).toBe('android');
		expect(detectClientPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(
			'ios'
		);
	});
});

describe('slotAssets', () => {
	it('picks primary and alternate assets for desktop slots', () => {
		const windows = DOWNLOAD_SLOTS.find((slot) => slot.id === 'windows');
		expect(windows).toBeTruthy();
		const picked = slotAssets(sampleRelease, windows!);
		expect(picked.primary?.name).toBe('renbrowser-windows-amd64-installer.exe');
	});

	it('lists server binaries as alternates', () => {
		const server = DOWNLOAD_SLOTS.find((slot) => slot.id === 'server');
		expect(server).toBeTruthy();
		const picked = slotAssets(sampleRelease, server!);
		expect(picked.primary?.name).toBe('renbrowser-server-linux-amd64');
		expect(picked.alternates.map((asset) => asset.name)).toContain(
			'renbrowser-server-freebsd-amd64'
		);
	});

	it('discovers all packaged linux amd64 formats and mobile builds', () => {
		const release: RenBrowserRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'renbrowser-linux-amd64.flatpak',
					url: 'https://example.com/flatpak',
					size: 9_000_000,
					contentType: 'application/octet-stream'
				},
				{
					name: 'renbrowser-android-universal.apk',
					url: 'https://example.com/apk',
					size: 13_000_000,
					contentType: 'application/vnd.android.package-archive'
				},
				{
					name: 'renbrowser-ios.ipa',
					url: 'https://example.com/ipa',
					size: 11_000_000,
					contentType: 'application/octet-stream'
				}
			]
		};
		const linux = DOWNLOAD_SLOTS.find((slot) => slot.id === 'linux_amd64');
		const android = DOWNLOAD_SLOTS.find((slot) => slot.id === 'android');
		const ios = DOWNLOAD_SLOTS.find((slot) => slot.id === 'ios');
		expect(linux).toBeTruthy();
		expect(android).toBeTruthy();
		expect(ios).toBeTruthy();
		const linuxPicked = slotAssets(release, linux!);
		expect(linuxPicked.alternates.map((asset) => asset.name)).toContain(
			'renbrowser-linux-amd64.flatpak'
		);
		expect(slotAssets(release, android!).primary?.name).toBe('renbrowser-android-universal.apk');
		expect(slotAssets(release, ios!).primary?.name).toBe('renbrowser-ios.ipa');
	});

	it('maps legacy Windows XP builds to their own slot', () => {
		const release: RenBrowserRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'renbrowser-windows-amd64-winxp.exe',
					url: 'https://example.com/winxp-amd64',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'renbrowser-windows-386-winxp.exe',
					url: 'https://example.com/winxp-386',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		const winxp = DOWNLOAD_SLOTS.find((slot) => slot.id === 'windows_xp');
		const picked = slotAssets(release, winxp!);
		expect(picked.primary?.name).toBe('renbrowser-windows-386-winxp.exe');
		expect(picked.alternates.map((asset) => asset.name)).toContain(
			'renbrowser-windows-amd64-winxp.exe'
		);
	});
});

describe('slotsForRelease', () => {
	it('only shows optional slots when assets exist', () => {
		expect(slotsForRelease(sampleRelease).map((slot) => slot.id)).not.toContain('windows_xp');

		const release: RenBrowserRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'renbrowser-windows-amd64-winxp.exe',
					url: 'https://example.com/winxp',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		expect(slotsForRelease(release).map((slot) => slot.id)).toContain('windows_xp');
	});

	it('maps headless riscv64 server builds to the riscv64 slot', () => {
		const release: RenBrowserRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'renbrowser-server-linux-riscv64',
					url: 'https://example.com/server-riscv64',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		const riscv = DOWNLOAD_SLOTS.find((slot) => slot.id === 'linux_riscv64');
		const server = DOWNLOAD_SLOTS.find((slot) => slot.id === 'server');
		expect(slotAssets(release, riscv!).primary?.name).toBe('renbrowser-server-linux-riscv64');
		expect(slotAssets(release, server!).alternates.map((asset) => asset.name)).not.toContain(
			'renbrowser-server-linux-riscv64'
		);
		expect(slotsForRelease(release).map((slot) => slot.id)).toContain('linux_riscv64');
	});
});

describe('extra assets', () => {
	it('finds wasm modules and sbom files', () => {
		const release: RenBrowserRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'renbrowser-micron-translator.wasm',
					url: 'https://example.com/translator.wasm',
					size: 1,
					contentType: 'application/wasm'
				},
				{
					name: 'renbrowser-sbom.spdx.json',
					url: 'https://example.com/sbom',
					size: 1,
					contentType: 'application/json'
				}
			]
		};

		expect(findExtraWasmAssets(release).map((asset) => asset.name)).toEqual([
			'renbrowser-micron-translator.wasm'
		]);
		expect(findSbomAssets(release).map((asset) => asset.name)).toEqual([
			'renbrowser-sbom.spdx.json'
		]);
	});
});

describe('formatDownloadSize', () => {
	it('formats human-readable sizes', () => {
		expect(formatDownloadSize(0)).toBe('0 B');
		expect(formatDownloadSize(1024)).toBe('1.0 KB');
		expect(formatDownloadSize(13_967_116)).toBe('13 MB');
	});
});
