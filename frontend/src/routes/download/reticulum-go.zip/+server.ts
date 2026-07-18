import { error, type RequestHandler } from '@sveltejs/kit';
import { getSourceZipMeta, openSourceZipStream } from '$lib/server/source-zip';

export const GET: RequestHandler = async ({ url }) => {
	if (url.searchParams.get('meta') === '1') {
		const meta = (await getSourceZipMeta()) ?? null;
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

	const opened = await openSourceZipStream();
	if (!opened) {
		error(503, 'Source zip is not available yet. Try again shortly.');
	}

	const { meta, stream } = opened;
	const safeName = meta.filename.replace(/[^\w.\-]+/g, '_').slice(0, 128) || 'reticulum-go.zip';
	return new Response(stream, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Length': String(meta.bytes),
			'Content-Disposition': `attachment; filename="${safeName}"`,
			'Cache-Control': 'public, max-age=3600',
			'X-Source-Tag': meta.tag.replace(/[^\w.\-]+/g, '_').slice(0, 64),
			'X-Source-Fetched-At': meta.fetchedAt
		}
	});
};
