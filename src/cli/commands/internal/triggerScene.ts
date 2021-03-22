import * as NuxtHue from "../../../core/NuxtHue";
import { Command } from "../Command";

export const triggerScene: Command = {
  name: "Trigger scene",
  description: `[INTERNAL] Trigger a specific scene`,
  usage: "trigger-scene <SCENEID>",
  run(args = []): void {
    const sceneId = args[0];

    try {
      NuxtHue.getBridge().triggerScene(sceneId);
    } catch (error) {
      // Fail silently
    }
  }
};
