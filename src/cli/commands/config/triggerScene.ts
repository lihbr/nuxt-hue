import * as NuxtHue from "../../../core/NuxtHue";
import { Command } from "../Command";

export const triggerScene: Command = {
  name: "Trigger scene",
  description: `[INTERNAL] Trigger a specific scene`,
  usage: "trigger-scene <SCENEID>",
  async run(args = []): Promise<void> {
    const sceneId = args[0];

    if (NuxtHue.hasBridge() && (await NuxtHue.isPaired())) {
      await NuxtHue.getBridge().triggerScene(sceneId);
    }
  }
};
