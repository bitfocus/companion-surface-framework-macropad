import type { SurfaceSchemaLayoutDefinition } from '@companion-surface/base'
import { createControlId, MACROPAD_COLUMNS, MACROPAD_ROWS } from './util.js'

export function createSurfaceSchema(): SurfaceSchemaLayoutDefinition {
	const surfaceLayout: SurfaceSchemaLayoutDefinition = {
		stylePresets: {
			default: {
				colors: 'hex',
			},
		},
		controls: {},
	}

	for (let y = 0; y < MACROPAD_ROWS; y++) {
		for (let x = 0; x < MACROPAD_COLUMNS; x++) {
			surfaceLayout.controls[createControlId(y, x)] = {
				row: y,
				column: x,
			}
		}
	}

	return surfaceLayout
}
