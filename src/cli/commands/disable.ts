import { NuxtHue, logger } from "../../utils";
import { Command } from "./Command";

export default {
  name: "Disable",
  description: "Disable Nuxt Hue, you won't be cool anymore",
  usage: "disable",
  run(): void {
    NuxtHue.disable();
    logger.success(`Nuxt Hue is now disabled`);
  }
} as Command;
