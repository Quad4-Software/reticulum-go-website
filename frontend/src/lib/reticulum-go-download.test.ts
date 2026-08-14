import { describe, it, expect } from 'vitest';
import {
	RG_DOWNLOAD_SLOTS,
	detectClientPlatform,
	slotAssets,
	slotsForRelease,
	findExampleAssets,
	findSbomAssets,
	isDownloadableAssetName,
	type RgRelease
} from '$lib/reticulum-go-download';

const sampleRelease: RgRelease = {
	tag: 'v1.0.1',
	name: 'Reticulum-Go 1.0.1',
	publishedAt: '2026-01-01T00:00:00Z',
	prerelease: false,
	htmlUrl: 'https://github.com/Quad4-Software/Reticulum-Go/releases/tag/v1.0.1',
	assets: [
		{
			name: 'reticulum-go-linux-amd64',
			url: 'https://example.com/linux-amd64',
			size: 32_000_000,
			contentType: 'application/octet-stream'
		},
		{
			name: 'reticulum-go-example-pageserver-linux-amd64',
			url: 'https://example.com/pageserver',
			size: 1_000_000,
			contentType: 'application/octet-stream'
		},
		{
			name: 'reticulum-go-sbom.spdx.json',
			url: 'https://example.com/sbom',
			size: 500_000,
			contentType: 'application/json'
		},
		{
			name: 'reticulum-go-linux-amd64.cosign.bundle',
			url: 'https://example.com/bundle',
			size: 100,
			contentType: 'application/octet-stream'
		}
	]
};

describe('detectClientPlatform', () => {
	it('detects stack targets from user agents', () => {
		expect(detectClientPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows_amd64');
		expect(detectClientPlatform('Mozilla/5.0 (Windows NT 10.0; ARM64)')).toBe('windows_arm64');
		expect(detectClientPlatform('Mozilla/5.0 (Windows NT 5.1; rv:52.0) Gecko/20100101 Firefox/52.0')).toBe(
			'windows_386'
		);
		expect(detectClientPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux_amd64');
		expect(detectClientPlatform('Mozilla/5.0 (X11; Linux i686)')).toBe('linux_386');
		expect(detectClientPlatform('Mozilla/5.0 (X11; Linux riscv64)')).toBe('linux_riscv64');
		expect(detectClientPlatform('Mozilla/5.0 (X11; Linux aarch64)')).toBe('linux_arm64');
		expect(detectClientPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)')).toBe('macos_intel');
		expect(detectClientPlatform('Mozilla/5.0 (Macintosh; ARM Mac OS X)')).toBe('macos_arm');
	});
});

describe('slotAssets', () => {
	it('maps linux amd64 slot to release asset', () => {
		const slot = RG_DOWNLOAD_SLOTS.find((entry) => entry.id === 'linux_amd64');
		expect(slot).toBeTruthy();
		const picked = slotAssets(sampleRelease, slot!);
		expect(picked.primary?.name).toBe('reticulum-go-linux-amd64');
	});

	it('lists freebsd arm variants as alternates', () => {
		const release: RgRelease = {
			...sampleRelease,
			assets: [
				{
					name: 'reticulum-go-freebsd-amd64',
					url: 'https://example.com/amd64',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-freebsd-arm64',
					url: 'https://example.com/arm64',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-freebsd-arm',
					url: 'https://example.com/arm',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};
		const freebsd = RG_DOWNLOAD_SLOTS.find((slot) => slot.id === 'freebsd');
		const picked = slotAssets(release, freebsd!);
		expect(picked.alternates.map((asset) => asset.name)).toEqual([
			'reticulum-go-freebsd-arm',
			'reticulum-go-freebsd-arm64'
		]);
	});

	it('keeps legacy Windows builds in dedicated slots', () => {
		const release: RgRelease = {
			...sampleRelease,
			assets: [
				{
					name: 'reticulum-go-windows-amd64.exe',
					url: 'https://example.com/modern',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-windows-amd64-win7.exe',
					url: 'https://example.com/win7',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-windows-amd64-winxp.exe',
					url: 'https://example.com/winxp-amd64',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-windows-386-winxp.exe',
					url: 'https://example.com/winxp-386',
					size: 1,
					contentType: 'application/octet-stream'
				},
				{
					name: 'reticulum-go-linux-386',
					url: 'https://example.com/linux-386',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		const windows = RG_DOWNLOAD_SLOTS.find((slot) => slot.id === 'windows_amd64');
		const win7 = RG_DOWNLOAD_SLOTS.find((slot) => slot.id === 'windows_7');
		const winxp = RG_DOWNLOAD_SLOTS.find((slot) => slot.id === 'windows_xp');
		const linux386 = RG_DOWNLOAD_SLOTS.find((slot) => slot.id === 'linux_386');

		expect(slotAssets(release, windows!).primary?.name).toBe('reticulum-go-windows-amd64.exe');
		expect(slotAssets(release, windows!).alternates).toHaveLength(0);
		expect(slotAssets(release, win7!).primary?.name).toBe('reticulum-go-windows-amd64-win7.exe');
		expect(slotAssets(release, winxp!).primary?.name).toBe('reticulum-go-windows-386-winxp.exe');
		expect(slotAssets(release, linux386!).primary?.name).toBe('reticulum-go-linux-386');
	});
});

describe('slotsForRelease', () => {
	it('hides optional slots until assets exist', () => {
		expect(slotsForRelease(sampleRelease).map((slot) => slot.id)).not.toContain('windows_xp');
		expect(slotsForRelease(sampleRelease).map((slot) => slot.id)).not.toContain('linux_386');

		const release: RgRelease = {
			...sampleRelease,
			assets: [
				...sampleRelease.assets,
				{
					name: 'reticulum-go-windows-amd64-winxp.exe',
					url: 'https://example.com/winxp',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		expect(slotsForRelease(release).map((slot) => slot.id)).toContain('windows_xp');
	});

	it('shows linux riscv64 when the release ships it', () => {
		const release: RgRelease = {
			...sampleRelease,
			assets: [
				{
					name: 'reticulum-go-linux-riscv64',
					url: 'https://example.com/riscv64',
					size: 1,
					contentType: 'application/octet-stream'
				}
			]
		};

		const slot = RG_DOWNLOAD_SLOTS.find((entry) => entry.id === 'linux_riscv64');
		expect(slotAssets(release, slot!).primary?.name).toBe('reticulum-go-linux-riscv64');
		expect(slotsForRelease(release).map((entry) => entry.id)).toContain('linux_riscv64');
	});
});

describe('extra assets', () => {
	it('filters cosign bundles from downloadable assets', () => {
		expect(isDownloadableAssetName('reticulum-go-linux-amd64.cosign.bundle')).toBe(false);
		expect(isDownloadableAssetName('reticulum-go-linux-amd64')).toBe(true);
	});

	it('finds example and sbom assets', () => {
		expect(findExampleAssets(sampleRelease).map((asset) => asset.name)).toEqual([
			'reticulum-go-example-pageserver-linux-amd64'
		]);
		expect(findSbomAssets(sampleRelease).map((asset) => asset.name)).toEqual([
			'reticulum-go-sbom.spdx.json'
		]);
	});
});
