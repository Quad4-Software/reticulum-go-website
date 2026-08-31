import type { RequestHandler } from './$types';
import { reticulumMirrorGet } from '$lib/server/reticulum-mirror-handler';

export const prerender = false;

/**
 * Unofficial mirror root for reticulum.network.
 * Reserves /mirrors/reticulum and serves the upstream index.
 */
export const GET: RequestHandler = reticulumMirrorGet('');
