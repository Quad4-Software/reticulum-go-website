/**
 * Lightweight RNode serial framing helpers for provision flows.
 */

export const RNODE_FRAME_START = 0x3c;
export const RNODE_CMD_PROVISION = 0x90;
export const RNODE_CMD_HASH = 0x91;
export const RNODE_CMD_STATUS = 0x92;
export const RNODE_RESP_OK = 0xa0;

export function frameCommand(cmd: number, payload: Uint8Array = new Uint8Array(0)): Uint8Array {
	const out = new Uint8Array(4 + payload.length);
	out[0] = RNODE_FRAME_START;
	out[1] = cmd;
	out[2] = payload.length & 0xff;
	out.set(payload, 3);
	let csum = cmd ^ (payload.length & 0xff);
	for (const b of payload) csum ^= b;
	out[out.length - 1] = csum & 0xff;
	return out;
}

export function parseResponse(
	buf: Uint8Array
): { cmd: number; ok: boolean; payload: Uint8Array } | null {
	if (buf.length < 4 || buf[0] !== RNODE_FRAME_START) return null;
	const cmd = buf[1];
	const len = buf[2];
	if (buf.length < 4 + len) return null;
	const payload = buf.slice(3, 3 + len);
	return { cmd, ok: cmd === RNODE_RESP_OK || buf[3] === RNODE_RESP_OK, payload };
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', data.slice());
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
