import defu from "defu";
import { Module } from "@nuxt/types";
import { NuxtHueConfig } from "./core";

const DEFAULTS: NuxtHueConfig = {};
const CONFIG_KEY = "hue";

const nuxtModule: Module<NuxtHueConfig> = function(
  moduleOptions: NuxtHueConfig
): void {
  const options = defu<NuxtHueConfig, NuxtHueConfig>(
    this.options[CONFIG_KEY] || {},
    moduleOptions,
    DEFAULTS
  );

  console.log(options);
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
