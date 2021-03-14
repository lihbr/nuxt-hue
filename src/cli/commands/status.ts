import { NuxtHue, logger } from "../../utils";
import pkg from "../../../package.json";
import { Command } from "./Command";

export default {
  name: "Status",
  description: "Check Nuxt Hue status",
  usage: "status",
  async run(): Promise<void> {
    if (NuxtHue.hasBridge() && (await NuxtHue.isPaired())) {
      logger.info(
        `Nuxt Hue is ${
          NuxtHue.isEnabled() ? "enabled" : "disabled"
        } and connected to a bridge (${NuxtHue.getBridge().ip})`
      );
    } else {
      logger.warn(
        `Nuxt Hue is ${
          NuxtHue.isEnabled() ? "enabled" : "disabled"
        } but not connected to a bridge\n\nConnect to one with:\n  $ ${
          pkg.name
        } connect`
      );
    }
  }
} as Command;
