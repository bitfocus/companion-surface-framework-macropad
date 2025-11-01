import type { DiscoveredSurfaceInfo, OpenSurfaceResult, SurfaceContext, SurfacePlugin } from '@companion-surface/base'
import { FrameworkMacropadWrapper } from './instance.js'
import { createSurfaceSchema } from './surface-schema.js'
import HID from 'node-hid'

export interface MacropadInfo {
	path: string
}

const FrameworkMacropadPlugin: SurfacePlugin<MacropadInfo> = {
	init: async (): Promise<void> => {
		// Nothing to do
	},
	destroy: async (): Promise<void> => {
		// Nothing to do
	},

	checkSupportsHidDevice: (deviceInfo): DiscoveredSurfaceInfo<MacropadInfo> | null => {
		if (
			deviceInfo.vendorId === 0x32ac && // frame.work
			deviceInfo.productId === 0x0013 && // macropod
			deviceInfo.usagePage === 0xffdd && // rawhid interface
			deviceInfo.usage === 0x61
		) {
			return {
				surfaceId: `framework-macropad`, // Future: maybe some unique id, but the current hardware can only support one macropad on a system
				description: `Framework Macropad`,
				pluginInfo: {
					path: deviceInfo.path,
				},
			}
		} else {
			return null
		}
	},

	openSurface: async (
		surfaceId: string,
		pluginInfo: MacropadInfo,
		context: SurfaceContext,
	): Promise<OpenSurfaceResult> => {
		const device = await HID.HIDAsync.open(pluginInfo.path)

		return {
			surface: new FrameworkMacropadWrapper(surfaceId, device, context),
			registerProps: {
				brightness: true,
				surfaceLayout: createSurfaceSchema(),
				pincodeMap: null,
				configFields: null,
				location: null,
			},
		}
	},
}
export default FrameworkMacropadPlugin
