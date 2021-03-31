import defu from "defu";
import { Module } from "@nuxt/types";
import exit from "exit";
import { LogLevel } from "consola";
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

  // Log everything when on debug
  if (options.debug) {
    logger.level = LogLevel.Debug;
  }

  // Check status and exit if not OK
  const nuxtHueStatus = await NuxtHue.getStatus(options);
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

  // Current bridge
  const bridge = NuxtHue.getBridge(options);

  // Basic hooks
  this.nuxt.hook("ready", () => {
    logger.debug("ready hook");
    // Redundant
    // NuxtHue.triggerScene(options.scenes?.start.id, true, bridge, options);
  });
  this.nuxt.hook("error", () => {
    logger.debug("error hook");
    NuxtHue.triggerScene(options.scenes?.error.id, true, bridge, options);
  });
  this.nuxt.hook("close", () => {
    logger.debug("close hook");
    NuxtHue.triggerScene(options.scenes?.end.id, true, bridge, options);
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
    logger.debug("bundler:error hook");
    NuxtHue.triggerScene(options.scenes?.error.id, true, bridge, options);
  });
  this.nuxt.hook("bundler:done", () => {
    if (!hasBundlerError && hasBundlerChanges) {
      hasBundlerChanges = false;
      logger.debug("bundler:done hook");
      NuxtHue.triggerScene(options.scenes?.start.id, true, bridge, options);
    }
  });

  // Process exit hook
  let exited = false;
  function exitHandler(signal: number, shouldExit = false) {
    // Run only once
    if (exited) {
      return;
    }
    exited = true;

    logger.debug(
      `exitHandler hook, signal: ${signal}, shouldExit: ${shouldExit}`
    );

    if ([1, 2].includes(signal)) {
      NuxtHue.triggerSceneExec(options.scenes?.error.id, true, bridge, options);
    } else {
      NuxtHue.triggerSceneExec(options.scenes?.end.id, true, bridge, options);
    }

    if (shouldExit) {
      exit(signal);
    }
  }
  process.once("exit", exitHandler);
  process.once("SIGINT", exitHandler.bind(null, 128 + 2, true));
  process.once("SIGTERM", exitHandler.bind(null, 128 + 15, true));

  // Activate start scene
  NuxtHue.triggerScene(options.scenes?.start.id, true, bridge, options);
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
