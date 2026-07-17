/**
 * In-memory byte pipe used by device simulators.
 */

export class SimPort {
	private rx: Uint8Array[] = [];
	private waiters: Array<(chunk: Uint8Array) => void> = [];
	private closed = false;
	private peerWrite: ((data: Uint8Array) => void) | null = null;

	attachPeer(writeFromDevice: (data: Uint8Array) => void) {
		this.peerWrite = writeFromDevice;
	}

	/** Called by the virtual device to push bytes toward the host. */
	pushFromDevice(data: Uint8Array) {
		if (this.closed) return;
		const waiter = this.waiters.shift();
		if (waiter) {
			waiter(data);
			return;
		}
		this.rx.push(data);
	}

	async write(data: Uint8Array): Promise<void> {
		if (this.closed) throw new Error('Sim port closed');
		this.peerWrite?.(data);
	}

	async read(max = 4096): Promise<Uint8Array> {
		if (this.closed) throw new Error('Sim port closed');
		if (this.rx.length > 0) {
			const chunk = this.rx.shift()!;
			return chunk.length > max ? chunk.slice(0, max) : chunk;
		}
		return new Promise((resolve) => {
			this.waiters.push((chunk) => {
				resolve(chunk.length > max ? chunk.slice(0, max) : chunk);
			});
		});
	}

	close() {
		this.closed = true;
		this.rx = [];
		this.waiters = [];
	}
}
