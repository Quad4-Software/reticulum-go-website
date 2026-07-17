/**
 * Known RNode-class board metadata.
 */

import type { ChipFamily } from '../types';

export interface BoardInfo {
	id: string;
	label: string;
	chip: ChipFamily;
	dfuHint?: string;
	usbVendorId?: number;
	usbProductId?: number;
}

export const BOARDS: BoardInfo[] = [
	{
		id: 'heltec-v3',
		label: 'Heltec WiFi LoRa 32 V3',
		chip: 'esp32s3',
		dfuHint: 'Hold BOOT while tapping RESET then release BOOT'
	},
	{
		id: 'heltec-v2',
		label: 'Heltec WiFi LoRa 32 V2',
		chip: 'esp32',
		dfuHint: 'Hold BOOT while tapping RESET then release BOOT'
	},
	{
		id: 'tbeam',
		label: 'LilyGO T-Beam',
		chip: 'esp32',
		dfuHint: 'Hold BOOT while tapping RESET then release BOOT'
	},
	{
		id: 't-deck',
		label: 'LilyGO T-Deck',
		chip: 'esp32s3',
		dfuHint: 'Hold BOOT while tapping RESET then release BOOT'
	},
	{
		id: 'rak4631',
		label: 'RAK4631',
		chip: 'nrf52',
		dfuHint: 'Double tap RESET to enter DFU or use the board DFU button'
	},
	{
		id: 't-echo',
		label: 'LilyGO T-Echo',
		chip: 'nrf52',
		dfuHint: 'Double tap RESET to enter DFU mode'
	},
	{
		id: 'generic-esp32',
		label: 'Generic ESP32',
		chip: 'esp32',
		dfuHint: 'Hold BOOT while resetting the board'
	},
	{
		id: 'generic-nrf52',
		label: 'Generic nRF52',
		chip: 'nrf52',
		dfuHint: 'Enter serial DFU mode for your board'
	}
];

export function boardById(id: string): BoardInfo | undefined {
	return BOARDS.find((b) => b.id === id);
}
