import * as NuxtHue from "../../../core/NuxtHue"
import { logger } from "../../../utils"
import type { Command } from "../Command"

export const enable: Command = {
	name: "Enable",
	description: "Enable Nuxt Hue module in case you turned it off by mistake",
	usage: "enable",
	run(): void {
		NuxtHue.enable()
		logger.success("Nuxt Hue is now enabled")
	},
}
