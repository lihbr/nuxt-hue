import * as NuxtHue from "../../../core/NuxtHue";
import { logger } from "../../../utils";
import { Command } from "../Command";

export const wipe: Command = {
  name: "Wipe",
  description: "Like `rm -rf /*` but for Nuxt Hue config",
  usage: "wipe",
  run(): void {
    NuxtHue.wipe();
    logger.success(`Nuxt Hue config has been wiped`);
  }
};
