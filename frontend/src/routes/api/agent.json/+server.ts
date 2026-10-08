import type { RequestHandler } from './$types';
import { buildAgentContextPayload, jsonResponse } from '$lib/agent-context';

export const prerender = true;

/**
 * Machine-readable agent context (JSON).
 * Markdown briefs live at /llms.txt and /llms-full.txt for static hosting.
 */
export const GET: RequestHandler = () => {
	return jsonResponse(buildAgentContextPayload());
};
