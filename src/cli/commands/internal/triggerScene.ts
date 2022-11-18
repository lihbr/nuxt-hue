import * as NuxtHue from '../../../core/NuxtHue'
import { Command } from '../Command'

export const triggerScene: Command = {
	name: 'Trigger scene',
	description: '[INTERNAL] Trigger a specific scene',
	usage: 'trigger-scene <SCENEID>',
	run (args = []): void {
		const sceneId = args[0]

		NuxtHue.triggerScene(sceneId, true)
	}
}
