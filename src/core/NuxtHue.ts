import { NuxtOptionsModule } from "@nuxt/types/config/module";
import * as rc from "rc9";
import pkg from "../../package.json";
import { Bridge, Scene } from "./Bridge";

export enum NuxtHueCode {
  BridgeNotConfigured = "Bridge not Configured"
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
  buildModules?: NuxtOptionsModule[];
  hue?: {
    bridge?: BridgeOptions;
    scenes?: ScenesOptions;
  };
}

export class NuxtHue {
  static RCFILE = ".nuxtrc";

  /**
   * Read config file
   */
  static read(): NuxtHueConfig {
    return rc.readUser(NuxtHue.RCFILE);
  }

  /**
   * Write config file
   */
  private static write(config: NuxtHueConfig): void {
    rc.writeUser(config, NuxtHue.RCFILE);
  }

  /**
   * Update config file
   */
  private static update(config: NuxtHueConfig): void {
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
  static hasBridge(): boolean {
    const { hue } = NuxtHue.read();
    return !!(
      hue &&
      hue.bridge &&
      hue.bridge.ip &&
      hue.bridge.id &&
      hue.bridge.username
    );
  }

  /**
   * Get currently configured bridge
   */
  static getBridge(): Bridge {
    const { hue } = NuxtHue.read();

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
