import defu from "defu";
import { Module } from "@nuxt/types";
import exit from "exit";
import * as NuxtHue from "./core/NuxtHue";
import { logger } from "./utils";

const DEFAULTS: NuxtHue.Config = {};
const CONFIG_KEY = "hue";

const nuxtModule: Module<NuxtHue.Config> = async function(
  moduleOptions: NuxtHue.Config
): Promise<void> {
  const options = defu<NuxtHue.Config, NuxtHue.Config>(
    this.options[CONFIG_KEY] || {},
    moduleOptions,
    DEFAULTS
  );

  const nuxtHueStatus = await NuxtHue.getStatus();
  const nuxtHueFormattedStatus = await NuxtHue.getFormattedStatus(
    nuxtHueStatus,
    {
      withModule: false,
      withHint: true
    }
  );

  switch (nuxtHueStatus) {
    case NuxtHue.Code.BridgeAndScenesNotConfigured:
    case NuxtHue.Code.BridgeNotConfigured:
    case NuxtHue.Code.ScenesNotConfigured:
      logger.error(nuxtHueFormattedStatus);
      return;

    case NuxtHue.Code.Unknown:
      logger.fatal(nuxtHueFormattedStatus);
      return;

    default:
      break;
  }

  const bridge = NuxtHue.getBridge(options);

  // Basic hooks
  this.nuxt.hook("ready", () => {
    bridge.triggerScene(options.scenes?.start.id);
  });
  this.nuxt.hook("error", () => {
    bridge.triggerScene(options.scenes?.error.id);
  });
  this.nuxt.hook("close", () => {
    bridge.triggerScene(options.scenes?.end.id);
  });

  // Webpack build hooks
  let hasBundlerError = false;
  let hasBundlerChanges = false;
  this.nuxt.hook("bundler:change", () => {
    hasBundlerError = false;
  });
  this.nuxt.hook("bundler:error", () => {
    hasBundlerError = true;
    hasBundlerChanges = true;
    bridge.triggerScene(options.scenes?.error.id);
  });
  this.nuxt.hook("bundler:done", () => {
    if (!hasBundlerError && hasBundlerChanges) {
      hasBundlerChanges = false;
      bridge.triggerScene(options.scenes?.start.id);
    }
  });

  // Process exit hook
  process.on("exit", () => {
    bridge.triggerSceneExec(options.scenes?.end.id);
  });
  process.once("SIGINT", () => {
    bridge.triggerSceneExec(options.scenes?.end.id);
    exit(128 + 2);
  });
  process.once("SIGTERM", () => {
    bridge.triggerSceneExec(options.scenes?.end.id);
    exit(128 + 15);
  });
  process.once("uncaughtException", () => {
    bridge.triggerSceneExec(options.scenes?.error.id);
    exit(2);
  });

  // Activate start scene
  await bridge.triggerScene(options.scenes?.start.id);
  logger.info("💡 Nuxt Hue is running~");
};
(nuxtModule as any).meta = require("../package.json");

declare module "@nuxt/types" {
  interface NuxtConfig {
    [CONFIG_KEY]?: NuxtHue.Config;
  } // Nuxt 2.14+
  interface Configuration {
    [CONFIG_KEY]?: NuxtHue.Config;
  } // Nuxt 2.9 - 2.13
}

export default nuxtModule;
