import { NuxtHue, logger } from "../../utils";
import { Command } from "./Command";

export default {
  name: "Enable",
  description: "Enable Nuxt Hue, makes your cooler",
  usage: "enable",
  run(): void {
    NuxtHue.enable();
    logger.success(`Nuxt Hue is now enabled`);
  }
} as Command;
