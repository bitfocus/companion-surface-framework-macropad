import {
	CardGenerator,
	HostCapabilities,
	SurfaceDrawProps,
	SurfaceContext,
	SurfaceInstance,
	parseColor,
	ModuleLogger,
	createModuleLogger,
	RgbColor,
} from '@companion-surface/base'
import type { HIDAsync } from 'node-hid'
import { createControlId, parseControlId, MACROPAD_COLUMNS, MACROPAD_ROWS } from './util.js'

export class FrameworkMacropadWrapper implements SurfaceInstance {
	readonly #logger: ModuleLogger

	readonly #device: HIDAsync
	readonly #surfaceId: string
	// readonly #context: SurfaceContext

	/**
	 * Last drawn colours, to allow resending when brightness changes
	 */
	readonly #lastColours: Record<string, RgbColor> = {}
	#brightness: number = 50

	public get surfaceId(): string {
		return this.#surfaceId
	}
	public get productName(): string {
		return 'Framework Macropad'
	}

	public constructor(surfaceId: string, deck: HIDAsync, context: SurfaceContext) {
		this.#logger = createModuleLogger(`Framework/${surfaceId}`)
		this.#device = deck
		this.#surfaceId = surfaceId
		// this.#context = context

		this.#device.on('error', (e) => context.disconnect(e))

		this.#device.on('data', (data) => {
			if (data[0] === 0x50) {
				const x = data[1] - 1
				const y = data[2] - 1
				const pressed = data[3] > 0

				if (pressed) {
					context.keyDownById(`${y}/${x}`)
				} else {
					context.keyUpById(`${y}/${x}`)
				}
			}
		})
	}

	async init(): Promise<void> {
		// Start with blanking it
		await this.blank()
	}
	async close(): Promise<void> {
		await this.#clearPanel().catch(() => null)

		await this.#device.close()
	}

	updateCapabilities(_capabilities: HostCapabilities): void {
		// Not used
	}

	async ready(): Promise<void> {}

	async setBrightness(percent: number): Promise<void> {
		this.#brightness = percent
		for (let y = 0; y < MACROPAD_ROWS; y++) {
			for (let x = 0; x < MACROPAD_COLUMNS; x++) {
				const color = this.#lastColours[createControlId(y, x)] ?? { r: 0, g: 0, b: 0 }
				this.#writeKeyColour(x, y, color)
			}
		}
	}
	async blank(): Promise<void> {
		await this.#clearPanel()
	}
	async draw(_signal: AbortSignal, drawProps: SurfaceDrawProps): Promise<void> {
		const color = drawProps.color ? parseColor(drawProps.color) : { r: 0, g: 0, b: 0 }
		this.#lastColours[drawProps.controlId] = color

		const pos = parseControlId(drawProps.controlId)
		this.#writeKeyColour(pos.column, pos.row, color)
	}

	#writeKeyColour(x: number, y: number, color: RgbColor): void {
		const fillBuffer = Buffer.alloc(32)
		fillBuffer.writeUint8(0x0f, 0)
		fillBuffer.writeUint8(x + 1, 1)
		fillBuffer.writeUint8(y + 1, 2)

		const scale = (this.#brightness || 50) / 100
		fillBuffer.writeUint8(color.r * scale, 3)
		fillBuffer.writeUint8(color.g * scale, 4)
		fillBuffer.writeUint8(color.b * scale, 5)

		this.#device.write(fillBuffer).catch((e) => {
			this.#logger.error(`write failed: ${e}`)
		})
	}

	async #clearPanel(): Promise<void> {
		const clearBuffer = Buffer.alloc(32)
		clearBuffer.writeUint8(0x0b, 0)
		await this.#device.write(clearBuffer)
	}

	async showStatus(_signal: AbortSignal, _cardGenerator: CardGenerator): Promise<void> {
		// Nothing to display here
		// TODO - do some flashing lights to indicate each status?
	}
}
