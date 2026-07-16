import { buildLlmsFullTxt, markdownResponse } from '$lib/agent-context';

export const prerender = true;

export function GET() {
	return markdownResponse(buildLlmsFullTxt());
}
