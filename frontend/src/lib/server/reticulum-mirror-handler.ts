import { error, type RequestHandler } from '@sveltejs/kit';
import {
	ensureReticulumSiteMirror,
	getReticulumSiteMirrorMeta,
	injectMirrorBanner,
	openMirrorAsset
} from '$lib/server/reticulum-site-mirror';

export function reticulumMirrorGet(requestPath: string): RequestHandler {
	return async ({ url }) => {
		if (url.searchParams.get('meta') === '1') {
			const meta = (await getReticulumSiteMirrorMeta()) ?? (await ensureReticulumSiteMirror());
			if (!meta) {
				return new Response(JSON.stringify({ available: false }), {
					status: 503,
					headers: {
						'Content-Type': 'application/json; charset=utf-8',
						'Cache-Control': 'no-store'
					}
				});
			}
			return new Response(JSON.stringify({ available: true, ...meta }), {
				headers: {
					'Content-Type': 'application/json; charset=utf-8',
					'Cache-Control': 'public, max-age=60'
				}
			});
		}

		const asset = await openMirrorAsset(requestPath);
		if (!asset) {
			error(404, 'Mirror page not found');
		}

		if (asset.isHtml) {
			const html = injectMirrorBanner(asset.bytes.toString('utf8'), requestPath || '/');
			return new Response(html, {
				headers: {
					'Content-Type': asset.contentType,
					'Cache-Control': 'public, max-age=300',
					'X-Reticulum-Mirror': '1'
				}
			});
		}

		return new Response(Uint8Array.from(asset.bytes), {
			headers: {
				'Content-Type': asset.contentType,
				'Cache-Control': 'public, max-age=86400',
				'X-Reticulum-Mirror': '1'
			}
		});
	};
}
