/**
 * Device transport contract shared by serial bluetooth IP and sim.
 */

import type { ConnectOptions, TransportInfo, TransportKind } from '../types';

export interface DeviceTransport {
	readonly kind: TransportKind;
	connect(opts?: ConnectOptions): Promise<void>;
	disconnect(): Promise<void>;
	write(data: Uint8Array): Promise<void>;
	read(max?: number): Promise<Uint8Array>;
	setBaud?(baud: number): Promise<void>;
	getInfo(): TransportInfo;
}

export type SerialPortFilter = {
	usbVendorId?: number;
	usbProductId?: number;
};
