import exit from 'exit'

import { logger } from '../../../utils'
import { Command } from '../Command'
import * as NuxtHue from '../../../core/NuxtHue'

export const status: Command = {
	name: 'Status',
	description: 'Check Nuxt Hue status',
	usage: 'status',
	async run (): Promise<void> {
		const nuxtHueStatus = await NuxtHue.getStatus()
		const nuxtHueFormattedStatus = await NuxtHue.getFormattedStatus(
			nuxtHueStatus,
			{
				withModule: true,
				withHint: true
			}
		)

		switch (nuxtHueStatus) {
			case NuxtHue.Code.Ok:
				logger.info(nuxtHueFormattedStatus)
				break

			case NuxtHue.Code.BridgeAndScenesNotConfigured:
			case NuxtHue.Code.BridgeNotConfigured:
			case NuxtHue.Code.ScenesNotConfigured:
				logger.warn(nuxtHueFormattedStatus)
				break

			case NuxtHue.Code.Unknown:
			default:
				logger.fatal(nuxtHueFormattedStatus)
				exit(2)
				break
		}
	}
}
