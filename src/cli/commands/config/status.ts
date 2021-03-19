import exit from "exit";
import pkg from "../../../../package.json";
import { logger } from "../../../utils";
import { Command } from "../Command";
import { NuxtHue, NuxtHueCode } from "../../../core";
import { setup } from "./setup";
import { scenes } from "./scenes";

export const status: Command = {
  name: "Status",
  description: "Check Nuxt Hue status",
  usage: "status",
  async run(): Promise<void> {
    switch (await NuxtHue.getStatus()) {
      case NuxtHueCode.Ok:
        logger.info(
          `Nuxt Hue is ${
            NuxtHue.isEnabled() ? "enabled" : "disabled"
          }, connected to a bridge (${
            NuxtHue.getBridge().ip
          }), and has scenes configured`
        );
        break;

      case NuxtHueCode.BridgeAndScenesNotConfigured:
        logger.warn(
          `Nuxt Hue is not setup\n\nRun the setup wizard with:\n  $ ${pkg.name} ${setup.usage}`
        );
        break;

      case NuxtHueCode.BridgeNotConfigured:
        logger.warn(
          `Nuxt Hue is ${
            NuxtHue.isEnabled() ? "enabled but" : "disabled and"
          } not connected to a bridge\n\nConnect to one with:\n  $ ${
            pkg.name
          } connect`
        );
        break;

      case NuxtHueCode.ScenesNotConfigured:
        logger.warn(
          `Nuxt Hue is ${
            NuxtHue.isEnabled() ? "enabled" : "disabled"
          } and connected to a bridge but scenes are not configured\n\nConfigure them with:\n  $ ${
            pkg.name
          } ${scenes.usage}`
        );
        break;

      case NuxtHueCode.Unknown:
      default:
        logger.error(
          `Nuxt Hue status is unknown, this should not happen\n\nTry running the setup wizard with:\n  $ ${pkg.name} ${setup.usage}`
        );
        exit(1);
        break;
    }
  }
};
