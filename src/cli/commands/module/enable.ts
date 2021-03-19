import { NuxtHue } from "../../../core";
import { logger } from "../../../utils";
import { Command } from "../Command";

export const enable: Command = {
  name: "Enable",
  description: "Enable Nuxt Hue, makes your cooler",
  usage: "enable",
  run(): void {
    NuxtHue.enable();
    logger.success(`Nuxt Hue is now enabled`);
  }
};
