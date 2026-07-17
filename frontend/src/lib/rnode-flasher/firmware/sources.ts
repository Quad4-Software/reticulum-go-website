/**
 * Firmware source identifiers and labels.
 */

import type { FirmwareSourceId } from '../types';

export const FIRMWARE_SOURCES: Array<{
	id: FirmwareSourceId;
	label: string;
	comingSoon?: boolean;
}> = [
	{ id: 'official', label: 'Official RNode' },
	{ id: 'microreticulum', label: 'microReticulum' },
	{ id: 'tiny-reticulum-go', label: 'Tiny-Reticulum-Go', comingSoon: true },
	{ id: 'upload', label: 'Upload' }
];
