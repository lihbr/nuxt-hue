import { Config, logger } from "../../utils";
import { Command } from "./Command";

export default {
  name: "Enable",
  description: "Enable Nuxt Hue, makes your cooler",
  usage: "enable",
  run(): void {
    Config.enable();
    logger.success(`Nuxt Hue is now enabled`);
  }
} as Command;
