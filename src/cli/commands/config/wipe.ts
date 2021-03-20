import * as NuxtHue from "../../../core/NuxtHue";
import { logger } from "../../../utils";
import { Command } from "../Command";

export const wipe: Command = {
  name: "Wipe",
  description: "Wipe everything related to Nuxt Hue from .nuxtrc",
  usage: "wipe",
  run(): void {
    NuxtHue.wipe();
    logger.success(`Nuxt Hue has been wiped`);
  }
};
