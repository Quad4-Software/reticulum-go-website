import { buildLlmsTxt, markdownResponse } from '#lib/agent-context.ts';

export const prerender = true;

export function GET() {
	return markdownResponse(buildLlmsTxt());
}
