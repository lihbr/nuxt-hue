import defu from "defu";
import { Module } from "@nuxt/types";
import exit from "exit";
import * as NuxtHue from "./core/NuxtHue";
import { logger } from "./utils";

const DEFAULTS: NuxtHue.Config = {};
const CONFIG_KEY = "hue";

const nuxtModule: Module<NuxtHue.Config> = async function (
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
    logger.info("ready");
    bridge.triggerScene(options.scenes?.start.id);
  });
  this.nuxt.hook("error", () => {
    logger.info("error");
    bridge.triggerScene(options.scenes?.error.id);
  });
  this.nuxt.hook("close", () => {
    logger.info("close");
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
    logger.info("bundler:error");
    bridge.triggerScene(options.scenes?.error.id);
  });
  this.nuxt.hook("bundler:done", () => {
    if (!hasBundlerError && hasBundlerChanges) {
      hasBundlerChanges = false;
      logger.info("bundler:done");
      bridge.triggerScene(options.scenes?.start.id);
    }
  });

  // Process exit hook
  let exited = false;
  function exitHandler(signal: number, shouldExit = false) {
    if (exited) {
      return;
    }

    exited = true;

    if ([1, 2].includes(signal)) {
      bridge.triggerSceneExec(options.scenes?.error.id);
    } else {
      bridge.triggerSceneExec(options.scenes?.end.id);
    }

    if (shouldExit) {
      exit(signal);
    }
  }
  process.once("exit", exitHandler);
  process.once("SIGINT", exitHandler.bind(null, 128 + 2, true));
  process.once("SIGTERM", exitHandler.bind(null, 128 + 15, true));

  // Activate start scene
  await bridge.triggerScene(options.scenes?.start.id);
  logger.log("💡 Nuxt Hue is running~");
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
