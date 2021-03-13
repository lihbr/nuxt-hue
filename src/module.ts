import defu from "defu";
import { Module } from "@nuxt/types";

export interface ModuleOptions {}
const DEFAULTS: ModuleOptions = {};
const CONFIG_KEY = "hue";

const nuxtModule: Module<ModuleOptions> = function(moduleOptions) {
  const options = defu<ModuleOptions, ModuleOptions>(
    this.options[CONFIG_KEY] || {},
    moduleOptions,
    DEFAULTS
  );

  console.log(options);
};
(nuxtModule as any).meta = require("../package.json");

declare module "@nuxt/types" {
  interface NuxtConfig {
    [CONFIG_KEY]?: ModuleOptions;
  } // Nuxt 2.14+
  interface Configuration {
    [CONFIG_KEY]?: ModuleOptions;
  } // Nuxt 2.9 - 2.13
}

export default nuxtModule;
