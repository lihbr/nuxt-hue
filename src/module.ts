import { defineNuxtModule, createResolver, addPlugin } from '@nuxt/kit'
import exit from 'exit'
import { LogLevel } from 'consola'

import * as NuxtHue from './core/NuxtHue'
import { logger } from './utils'

export default defineNuxtModule<NuxtHue.Config>({
	meta: {
		name: 'nuxt-hue',
		configKey: 'hue',
		compatibility: { nuxt: '>=3.0.0' }
	},
	defaults () {
		return {}
	},
	hooks: {},
	async setup (mergedOptions, nuxt) {
		// Log everything when on debug
		if (mergedOptions.debug) {
			logger.level = LogLevel.Debug
		}

		// Check status and exit if not OK
		const nuxtHueStatus = await NuxtHue.getStatus(mergedOptions)
		const nuxtHueFormattedStatus = await NuxtHue.getFormattedStatus(
			nuxtHueStatus,
			{
				withModule: false,
				withHint: true
			}
		)
		switch (nuxtHueStatus) {
			case NuxtHue.Code.BridgeAndScenesNotConfigured:
			case NuxtHue.Code.BridgeNotConfigured:
			case NuxtHue.Code.ScenesNotConfigured:
				logger.error(nuxtHueFormattedStatus)
				return

			case NuxtHue.Code.Unknown:
				logger.fatal(nuxtHueFormattedStatus)
				return

			default:
				break
		}

		// Runtime, only in development mode
		if (nuxt.options.dev) {
			const resolver = createResolver(import.meta.url)
			const plugin = resolver.resolve('./plugin')
			nuxt.options.build.transpile.push(plugin, resolver.resolve('./'))
			addPlugin(plugin)

			// Expose options through public runtime config
			nuxt.options.runtimeConfig.public ||= {} as typeof nuxt.options.runtimeConfig.public
			nuxt.options.runtimeConfig.public['nuxt-hue'] = mergedOptions

			nuxt.options.vite.server ||= {}
			nuxt.options.vite.server!.fs ||= {}
			nuxt.options.vite.server!.fs!.allow ||= []
			nuxt.options.vite.server!.fs!.allow!.push(resolver.resolve('../'))
			nuxt.options.vite.optimizeDeps ||= {}
			nuxt.options.vite.optimizeDeps!.exclude ||= []
			nuxt.options.vite.optimizeDeps!.exclude!.push(plugin)
		}

		// Current bridge
		const bridge = NuxtHue.getBridge(mergedOptions)

		// Basic
		nuxt.hook('ready', () => {
			logger.debug('ready')
			// Redundant
			// NuxtHue.triggerScene(mergedOptions.scenes?.start.id, true, bridge, mergedOptions);
		})
		nuxt.hook('close', () => {
			logger.debug('close')
			NuxtHue.triggerScene(mergedOptions.scenes?.end.id, true, bridge, mergedOptions)
		})

		// Build
		let hasBuildError = false
		let hasBuildChanges = false
		nuxt.hook('build:before', () => {
			logger.debug('build:before')
			hasBuildError = false
		})
		nuxt.hook('build:error', () => {
			logger.debug('build:error')
			hasBuildError = true
			hasBuildChanges = true
			NuxtHue.triggerScene(mergedOptions.scenes?.error.id, true, bridge, mergedOptions)
		})
		nuxt.hook('build:done', () => {
			logger.debug('build:done')
			if (!hasBuildError && hasBuildChanges) {
				hasBuildChanges = false
				NuxtHue.triggerScene(mergedOptions.scenes?.start.id, true, bridge, mergedOptions)
			}
		})

		// Process exit
		let exited = false
		function exitHandler (signal: number, shouldExit = false) {
			// Run only once
			if (exited) {
				return
			}
			exited = true

			logger.debug(
				`exitHandler hook, signal: ${signal}, shouldExit: ${shouldExit}`
			)

			if ([1, 2].includes(signal)) {
				NuxtHue.triggerSceneExec(mergedOptions.scenes?.error.id, true, bridge, mergedOptions)
			} else {
				NuxtHue.triggerSceneExec(mergedOptions.scenes?.end.id, true, bridge, mergedOptions)
			}

			if (shouldExit) {
				exit(signal)
			}
		}
		process.once('exit', exitHandler)
		process.once('SIGINT', exitHandler.bind(null, 128 + 2, true))
		process.once('SIGTERM', exitHandler.bind(null, 128 + 15, true))

		// Activate start scene
		NuxtHue.triggerScene(mergedOptions.scenes?.start.id, true, bridge, mergedOptions)
		logger.log('💡 Nuxt Hue is running~')
	}
})
