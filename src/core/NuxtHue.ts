import { NuxtOptionsModule } from "@nuxt/types/config/module";
import * as rc from "rc9";
import pkg from "../../package.json";
import { Bridge, Scene } from "./Bridge";

export interface BridgeOptions {
  ip: string;
  id: string;
  username: string;
}

export interface ScenesOptions {
  start: Pick<Scene, "id" | "name">;
  error: Pick<Scene, "id" | "name">;
  end: Pick<Scene, "id" | "name">;
}

export interface Config {
  bridge?: BridgeOptions;
  scenes?: ScenesOptions;
}

export interface ConfigRC {
  buildModules?: NuxtOptionsModule[];
  hue?: Config;
}

export enum Code {
  Ok = "Ok",
  BridgeAndScenesNotConfigured = "Bridge and Scenes Are Not Configured",
  BridgeNotConfigured = "Bridge Not Configured",
  ScenesNotConfigured = "Scenes Not Configured",
  Unknown = "Unknown"
}

export const RC_FILE = ".nuxtrc";

export const CLI_COMMAND = "nuxt-hue";

/**
 * Read config file
 */
export function read(): ConfigRC {
  return rc.readUser(RC_FILE);
}

/**
 * Write config file
 */
export function write(config: ConfigRC): void {
  rc.writeUser(config, RC_FILE);
}

/**
 * Update config file
 */
export function update(config: ConfigRC): void {
  rc.updateUser(config, RC_FILE);
}

/**
 * Remove everything Nuxt Hue related from config file
 */
export function wipe(): void {
  const config = read();

  delete config.hue;
  config.buildModules = config.buildModules?.filter(i => i !== pkg.name) ?? [];
  if (!config.buildModules.length) {
    delete config.buildModules;
  }

  write(config);
}

/**
 * Remove bridge options from config file
 */
export function wipeBridge(): void {
  const config = read();

  if (config.hue) {
    delete config.hue.bridge;
    if (Object.keys(config.hue).length === 0) {
      delete config.hue;
    }
  }

  write(config);
}

/**
 * Remove scenes options from config file
 */
export function wipeScenes(): void {
  const config = read();

  if (config.hue) {
    delete config.hue.scenes;
    if (Object.keys(config.hue).length === 0) {
      delete config.hue;
    }
  }

  write(config);
}

/**
 * Enable Nuxt Hue module
 */
export function enable(): void {
  const config = read();

  if (config.buildModules) {
    if (!config.buildModules.find(i => i === pkg.name)) {
      config.buildModules.push(pkg.name);
    }
  } else {
    config.buildModules = [pkg.name];
  }

  write(config);
}

/**
 * Disable Nuxt Hue module
 */
export function disable(): void {
  const config = read();

  config.buildModules = config.buildModules?.filter(i => i !== pkg.name) ?? [];
  if (!config.buildModules.length) {
    delete config.buildModules;
  }

  write(config);
}

/**
 * Check if Nuxt Hue module is enabled
 */
export function isEnabled(): boolean {
  const config = read();
  return !!config.buildModules?.find(i => i === pkg.name) ?? false;
}

/**
 * Check if Nuxt Hue has a bridge
 */
export function hasBridge(hue?: Config): boolean {
  if (!hue) {
    hue = read().hue;
  }

  return !!(
    hue &&
    hue.bridge &&
    hue.bridge.ip &&
    hue.bridge.id &&
    hue.bridge.username
  );
}

/**
 * Check if Nuxt Hue has scenes
 */
export function hasScenes(hue?: Config): boolean {
  if (!hue) {
    hue = read().hue;
  }

  return !!(
    hue &&
    hue.scenes &&
    hue.scenes.start &&
    hue.scenes.start.id &&
    hue.scenes.start.name &&
    hue.scenes.error &&
    hue.scenes.error.id &&
    hue.scenes.error.name &&
    hue.scenes.end &&
    hue.scenes.end.id &&
    hue.scenes.end.name
  );
}

/**
 * Get current status code
 */
export async function getStatus(hue?: Config): Promise<Code> {
  if (!hue) {
    hue = read().hue;
  }

  const bridgeOk = hasBridge() && (await isPaired());
  const scenesOk = hasScenes();

  if (bridgeOk && scenesOk) {
    return Code.Ok;
  } else if (!bridgeOk && !scenesOk) {
    return Code.BridgeAndScenesNotConfigured;
  } else if (!bridgeOk) {
    return Code.BridgeNotConfigured;
  } else if (!scenesOk) {
    return Code.ScenesNotConfigured;
  } else {
    return Code.Unknown;
  }
}

/**
 * Get formatted status code for provided one or current
 */
export async function getFormattedStatus(
  status?: Code,
  {
    withModule = false,
    withHint = false
  }: { withModule?: boolean; withHint?: boolean } = {}
): Promise<string> {
  if (!status) {
    status = await getStatus();
  }

  const maybeModule = withModule
    ? ` ${isEnabled() ? "enabled" : "disabled"}`
    : "";
  const maybeModuleComma = withModule ? "," : "";
  const maybeModuleWithConjunction = withModule
    ? `${maybeModule}${isEnabled() ? " but" : " and"}`
    : "";

  let maybeHint = withHint ? "\n\n" : "";
  switch (status) {
    case Code.Ok:
      return `Nuxt Hue is${maybeModule}${maybeModuleComma} connected to a bridge (${
        getBridge().ip
      })${maybeModuleComma} and has scenes configured`;

    case Code.BridgeAndScenesNotConfigured:
      maybeHint += withHint
        ? `Run the setup wizard with:\n  $ ${CLI_COMMAND} setup`
        : "";
      // Never display module status as it's not relevant here
      return `Nuxt Hue is not setup${maybeHint}`;

    case Code.BridgeNotConfigured:
      maybeHint += withHint
        ? `Connect to one with:\n  $ ${CLI_COMMAND} connect`
        : "";
      return `Nuxt Hue is${maybeModuleWithConjunction} not connected to a bridge${maybeHint}`;

    case Code.ScenesNotConfigured:
      maybeHint += withHint
        ? `Configure them with:\n  $ ${CLI_COMMAND} scenes`
        : "";
      return `Nuxt Hue is${maybeModule}${
        withModule ? " and" : ""
      } connected to a bridge but scenes are not configured${maybeHint}`;

    case Code.Unknown:
    default:
      maybeHint += withHint
        ? `Try running the setup wizard with:\n  $ ${CLI_COMMAND} setup`
        : "";
      // Never display module status as it's not relevant here
      return `Nuxt Hue status is unknown, this should not happen${maybeHint}`;
  }
}

/**
 * Get currently configured bridge
 */
export function getBridge(hue?: Config): Bridge {
  if (!hue) {
    hue = read().hue;
  }

  if (hue && hue.bridge) {
    const { ip, id, username } = hue.bridge;
    return new Bridge(ip, id, username);
  } else {
    throw new Error(Code.BridgeNotConfigured);
  }
}

/**
 * Get currently configured scenes
 */
export function getScenes(hue?: Config): ScenesOptions {
  if (!hue) {
    hue = read().hue;
  }

  if (hue && hue.scenes) {
    return hue.scenes;
  } else {
    throw new Error(Code.ScenesNotConfigured);
  }
}

/**
 * Check if a bridge is correctly configured, wipe its config if not
 */
export async function isPaired(): Promise<boolean> {
  const bridge = getBridge();

  const isPaired = await bridge.isPaired();

  if (!isPaired) {
    wipeBridge();
  }

  return isPaired;
}

/**
 * Update bridge options
 */
export function updateBridge({ ip, id, username }: BridgeOptions): void {
  update({
    hue: {
      bridge: {
        ip,
        id,
        username
      }
    }
  });
}

/**
 * Update scenes options
 */
export function updateScenes({ start, error, end }: ScenesOptions): void {
  update({
    hue: {
      scenes: {
        start,
        error,
        end
      }
    }
  });
}
