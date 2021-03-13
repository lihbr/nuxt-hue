import { Config, logger } from "../../utils";
import pkg from "../../../package.json";
import { Command } from "./Command";

export default {
  name: "Status",
  description: "Check Nuxt Hue status",
  usage: "status",
  async run(): Promise<void> {
    const config = Config.read();

    if (Config.hasBridge() && (await Config.isPaired())) {
      logger.info(
        `Nuxt Hue is ${
          Config.isEnabled() ? "enabled" : "disabled"
        } and connected to a bridge (${config.hue.bridge.ip})`
      );
    } else {
      logger.warn(
        `Nuxt Hue is ${
          Config.isEnabled() ? "enabled" : "disabled"
        } but not connected to a bridge\n\nConnect to one with:\n  $ ${
          pkg.name
        } connect`
      );
    }
  }
} as Command;
