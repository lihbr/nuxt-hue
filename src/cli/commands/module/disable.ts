import * as NuxtHue from "../../../core/NuxtHue"
import { logger } from "../../../utils"
import type { Command } from "../Command"

export const disable: Command = {
	name: "Disable",
	description: "Disable Nuxt Hue module, you won't be cool anymore",
	usage: "disable",
	run(): void {
		NuxtHue.disable()
		logger.success("Nuxt Hue is now disabled")
	},
}
