import { defineNuxtPlugin } from '#app'
import { LogLevel } from 'consola'

import type { Config } from './core/NuxtHue'
import { Bridge } from './core/Bridge'
import { logger } from './utils'

const pkgName = 'nuxt-hue'
let hasError = false

export default defineNuxtPlugin((nuxtApp) => {
	const mergedOptions: Config =
		nuxtApp.payload.config[pkgName] ??
		nuxtApp.payload.config.public[pkgName] ??
		{}

	// Log everything when on debug
	if (mergedOptions.debug) {
		logger.level = LogLevel.Debug
	}

	const bridge = new Bridge(
		mergedOptions.bridge!.ip,
		mergedOptions.bridge!.id,
		mergedOptions.bridge?.username
	)

	const triggerScene = async (kind: 'start' | 'error') => {
		try {
			await bridge.triggerScene(mergedOptions.scenes?.[kind].id)
		} catch (error) {
			if (mergedOptions?.debug) {
				logger.warn(error)
			}
		}
	}

	// App
	nuxtApp.hook('app:created', () => {
		logger.debug('app:created')
		setTimeout(() => {
			if (hasError) {
				hasError = false
			} else {
				triggerScene('start')
			}
		}, 500)
	})
	nuxtApp.hook('app:error', () => {
		logger.debug('app:error')
		if (!hasError) {
			hasError = true
			triggerScene('error')
		}
	})
	nuxtApp.hook('app:error:cleared', () => {
		logger.debug('app:error:cleared')
		hasError = false
		triggerScene('start')
	})

	// Vue
	nuxtApp.hook('vue:error', () => {
		logger.debug('vue:error')
		if (!hasError) {
			hasError = true
			triggerScene('error')
		}
	})

	// Vite
	// @ts-expect-error - Replaced at build time
	if (importMetaHot) {
		// @ts-expect-error - Replaced at build time
		importMetaHot.on('vite:beforeUpdate', () => {
			logger.debug('vite:beforeUpdate')
			if (hasError) {
				hasError = false
				triggerScene('start')
			}
		})
		// @ts-expect-error - Replaced at build time
		importMetaHot.on('vite:error', () => {
			logger.debug('vite:error')
			if (!hasError) {
				hasError = true
				triggerScene('error')
			}
		})
	}
})
