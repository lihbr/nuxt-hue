import defu from "defu";
import { Module } from "@nuxt/types";
import pkg from "../package.json";
import { NuxtHue, NuxtHueCode, NuxtHueConfig } from "./core";
import { logger } from "./utils";
import { connect, scenes, setup } from "./cli/commands/config";

const DEFAULTS: NuxtHueConfig = {};
const CONFIG_KEY = "hue";

const nuxtModule: Module<NuxtHueConfig> = async function(
  moduleOptions: NuxtHueConfig
): Promise<void> {
  const options = defu<NuxtHueConfig, NuxtHueConfig>(
    this.options[CONFIG_KEY] || {},
    moduleOptions,
    DEFAULTS
  );

  switch (await NuxtHue.getStatus()) {
    case NuxtHueCode.BridgeAndScenesNotConfigured:
      logger.warn(
        `Nuxt Hue is not setup\n\nRun the setup wizard with:\n  $ ${pkg.name} ${setup.usage}`
      );
      return;

    case NuxtHueCode.BridgeNotConfigured:
      logger.error(
        `Nuxt Hue is not connected to a bridge\n\nConnect to one first with:\n  $ ${pkg.name} ${connect.usage}`
      );
      return;

    case NuxtHueCode.ScenesNotConfigured:
      logger.error(
        `Nuxt Hue is connected to a bridge but scenes are not configured\n\nConfigure them with:\n  $ ${pkg.name} ${scenes.usage}`
      );
      return;

    case NuxtHueCode.Unknown:
      logger.error(
        `Nuxt Hue status is unknown, this should not happen\n\nTry running the setup wizard with:\n  $ ${pkg.name} ${setup.usage}`
      );
      return;

    default:
      break;
  }

  const bridge = NuxtHue.getBridge(options);

  bridge.triggerScene(options.scenes?.start.id as string);
  this.nuxt.hook("ready", () => {
    bridge.triggerScene(options.scenes?.start.id as string);
  });
  this.nuxt.hook("error", () => {
    bridge.triggerScene(options.scenes?.error.id as string);
  });
  this.nuxt.hook("close", () => {
    bridge.triggerScene(options.scenes?.end.id as string);
  });
};
(nuxtModule as any).meta = require("../package.json");

declare module "@nuxt/types" {
  interface NuxtConfig {
    [CONFIG_KEY]?: NuxtHueConfig;
  } // Nuxt 2.14+
  interface Configuration {
    [CONFIG_KEY]?: NuxtHueConfig;
  } // Nuxt 2.9 - 2.13
}

export default nuxtModule;
