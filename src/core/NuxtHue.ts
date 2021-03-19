import { NuxtOptionsModule } from "@nuxt/types/config/module";
import * as rc from "rc9";
import pkg from "../../package.json";
import { Bridge, Scene } from "./Bridge";

export enum NuxtHueCode {
  Ok = "Ok",
  BridgeAndScenesNotConfigured = "Bridge and Scenes Are Not Configured",
  BridgeNotConfigured = "Bridge Not Configured",
  ScenesNotConfigured = "Scenes Not Configured",
  Unknown = "Unknown"
}

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

export interface NuxtHueConfig {
  bridge?: BridgeOptions;
  scenes?: ScenesOptions;
}

export interface NuxtHueConfigRC {
  buildModules?: NuxtOptionsModule[];
  hue?: NuxtHueConfig;
}

export class NuxtHue {
  static RCFILE = ".nuxtrc";

  /**
   * Read config file
   */
  static read(): NuxtHueConfigRC {
    return rc.readUser(NuxtHue.RCFILE);
  }

  /**
   * Write config file
   */
  private static write(config: NuxtHueConfigRC): void {
    rc.writeUser(config, NuxtHue.RCFILE);
  }

  /**
   * Update config file
   */
  private static update(config: NuxtHueConfigRC): void {
    rc.updateUser(config, NuxtHue.RCFILE);
  }

  /**
   * Remove everything Nuxt Hue related from config file
   */
  static wipe(): void {
    const config = NuxtHue.read();

    delete config.hue;
    config.buildModules =
      config.buildModules?.filter(i => i !== pkg.name) ?? [];
    if (!config.buildModules.length) {
      delete config.buildModules;
    }

    NuxtHue.write(config);
  }

  /**
   * Remove bridge options from config file
   */
  static wipeBridge(): void {
    const config = NuxtHue.read();

    if (config.hue) {
      delete config.hue.bridge;
      if (Object.keys(config.hue).length === 0) {
        delete config.hue;
      }
    }

    NuxtHue.write(config);
  }

  /**
   * Remove scenes options from config file
   */
  static wipeScenes(): void {
    const config = NuxtHue.read();

    if (config.hue) {
      delete config.hue.scenes;
      if (Object.keys(config.hue).length === 0) {
        delete config.hue;
      }
    }

    NuxtHue.write(config);
  }

  /**
   * Enable Nuxt Hue module
   */
  static enable(): void {
    const config = NuxtHue.read();

    if (config.buildModules) {
      if (!config.buildModules.find(i => i === pkg.name)) {
        config.buildModules.push(pkg.name);
      }
    } else {
      config.buildModules = [pkg.name];
    }

    NuxtHue.write(config);
  }

  /**
   * Disable Nuxt Hue module
   */
  static disable(): void {
    const config = NuxtHue.read();

    config.buildModules =
      config.buildModules?.filter(i => i !== pkg.name) ?? [];
    if (!config.buildModules.length) {
      delete config.buildModules;
    }

    NuxtHue.write(config);
  }

  /**
   * Check if Nuxt Hue module is enabled
   */
  static isEnabled(): boolean {
    const config = NuxtHue.read();
    return !!config.buildModules?.find(i => i === pkg.name) ?? false;
  }

  /**
   * Check if Nuxt Hue has a bridge
   */
  static hasBridge(hue?: NuxtHueConfig): boolean {
    if (!hue) {
      hue = NuxtHue.read().hue;
    }

    return !!(
      hue &&
      hue.bridge &&
      hue.bridge.ip &&
      hue.bridge.id &&
      hue.bridge.username
    );
  }

  static hasScenes(hue?: NuxtHueConfig): boolean {
    if (!hue) {
      hue = NuxtHue.read().hue;
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

  static async getStatus(hue?: NuxtHueConfig): Promise<string> {
    if (!hue) {
      hue = NuxtHue.read().hue;
    }

    const bridgeOk = NuxtHue.hasBridge() && (await NuxtHue.isPaired());
    const scenesOk = NuxtHue.hasScenes();

    if (bridgeOk && scenesOk) {
      return NuxtHueCode.Ok;
    } else if (!bridgeOk && !scenesOk) {
      return NuxtHueCode.BridgeAndScenesNotConfigured;
    } else if (!bridgeOk) {
      return NuxtHueCode.BridgeNotConfigured;
    } else if (!scenesOk) {
      return NuxtHueCode.ScenesNotConfigured;
    } else {
      return NuxtHueCode.Unknown;
    }
  }

  /**
   * Get currently configured bridge
   */
  static getBridge(hue?: NuxtHueConfig): Bridge {
    if (!hue) {
      hue = NuxtHue.read().hue;
    }

    if (hue && hue.bridge) {
      const { ip, id, username } = hue.bridge;
      return new Bridge(ip, id, username);
    } else {
      throw new Error(NuxtHueCode.BridgeNotConfigured);
    }
  }

  /**
   * Check if a bridge is correctly configured, wipe its config if not
   */
  static async isPaired(): Promise<boolean> {
    const bridge = this.getBridge();

    const isPaired = await bridge.isPaired();

    if (!isPaired) {
      NuxtHue.wipeBridge();
    }

    return isPaired;
  }

  /**
   * Update bridge options
   */
  static updateBridge({ ip, id, username }: BridgeOptions): void {
    NuxtHue.update({
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
  static updateScenes({ start, error, end }: ScenesOptions): void {
    NuxtHue.update({
      hue: {
        scenes: {
          start,
          error,
          end
        }
      }
    });
  }
}
