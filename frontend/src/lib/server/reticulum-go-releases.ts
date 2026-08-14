import type { RgAsset, RgRelease, RgReleasesSnapshot } from '$lib/reticulum-go-download';
import { isDownloadableAssetName } from '$lib/download-utils';
import {
	createReleaseFetcher,
	type GitHubAsset,
	type GitHubRelease
} from '$lib/server/github-releases';

const REPO_OWNER = 'Quad4-Software';
const REPO_NAME = 'Reticulum-Go';
const USER_AGENT = 'reticulum-go-website-releases';

function normalizeAsset(asset: GitHubAsset): RgAsset | null {
	if (!asset.name || !asset.browser_download_url || !isDownloadableAssetName(asset.name)) {
		return null;
	}
	return {
		name: asset.name,
		url: asset.browser_download_url,
		size: asset.size ?? 0,
		contentType: asset.content_type ?? 'application/octet-stream'
	};
}

function normalizeRelease(release: GitHubRelease): RgRelease | null {
	if (!release.tag_name || !release.html_url || !release.published_at || release.draft) {
		return null;
	}

	const assets = (release.assets ?? [])
		.map(normalizeAsset)
		.filter((asset): asset is RgAsset => asset != null);

	return {
		tag: release.tag_name,
		name: release.name || release.tag_name,
		publishedAt: release.published_at,
		prerelease: release.prerelease === true,
		htmlUrl: release.html_url,
		assets
	};
}

const releaseFetcher = createReleaseFetcher<RgRelease>({
	owner: REPO_OWNER,
	repo: REPO_NAME,
	userAgent: USER_AGENT,
	normalizeRelease
});

export async function getReticulumGoReleases(): Promise<RgReleasesSnapshot | null> {
	return releaseFetcher.getReleases();
}

export function __resetReticulumGoReleaseCacheForTests() {
	releaseFetcher.resetForTests();
}
