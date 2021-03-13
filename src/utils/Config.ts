import { NuxtOptionsModule } from "@nuxt/types/config/module";
import * as rc from "rc9";
import pkg from "../../package.json";
import { Bridge } from "./Bridge";

interface BridgeOptions {
  ip?: string;
  id?: string;
  username?: string;
}

interface ScenesOptions {
  start: string;
  error: string;
  end: string;
}

enum CODES {
  BRIDGE_NOT_CONFIGURED = "Bridge not Configured"
}

export interface NuxtHueConfig {
  buildModules?: NuxtOptionsModule[];
  hue?: {
    bridge?: BridgeOptions;
    scenes?: ScenesOptions;
  };
}

export class Config {
  static RCFILE = ".nuxtrc";

  static read(): NuxtHueConfig {
    return rc.readUser(Config.RCFILE);
  }

  private static write(config: NuxtHueConfig): void {
    rc.writeUser(config, Config.RCFILE);
  }

  private static update(config: NuxtHueConfig): void {
    rc.updateUser(config, Config.RCFILE);
  }

  static wipe(): void {
    const config = Config.read();

    delete config.hue;
    config.buildModules =
      config.buildModules?.filter(i => i !== pkg.name) ?? [];
    if (!config.buildModules.length) {
      delete config.buildModules;
    }

    Config.write(config);
  }

  static wipeBridge(): void {
    const config = Config.read();

    if (config.hue) {
      delete config.hue.bridge;
      if (Object.keys(config.hue).length === 0) {
        delete config.hue;
      }
    }

    Config.write(config);
  }

  static enable(): void {
    const config = Config.read();

    if (config.buildModules) {
      if (!config.buildModules.find(i => i === pkg.name)) {
        config.buildModules.push(pkg.name);
      }
    } else {
      config.buildModules = [pkg.name];
    }

    Config.write(config);
  }

  static disable(): void {
    const config = Config.read();

    config.buildModules =
      config.buildModules?.filter(i => i !== pkg.name) ?? [];
    if (!config.buildModules.length) {
      delete config.buildModules;
    }

    Config.write(config);
  }

  static isEnabled(): boolean {
    const config = Config.read();
    return !!config.buildModules?.find(i => i === pkg.name) ?? false;
  }

  static hasBridge(): boolean {
    const { hue } = Config.read();
    return !!(
      hue &&
      hue.bridge &&
      hue.bridge.ip &&
      hue.bridge.id &&
      hue.bridge.username
    );
  }

  static getBridge(): Bridge {
    const { hue } = Config.read();

    if (hue && hue.bridge) {
      const { ip, id, username } = hue.bridge;
      return new Bridge(ip, id, username);
    } else {
      throw new Error(CODES.BRIDGE_NOT_CONFIGURED);
    }
  }

  static async isPaired(): Promise<boolean> {
    const bridge = this.getBridge();

    const isPaired = await bridge.isPaired();

    if (!isPaired) {
      Config.wipeBridge();
    }

    return isPaired;
  }

  static updateBridge({ ip, id, username }: BridgeOptions): void {
    Config.update({
      hue: {
        bridge: {
          ip,
          id,
          username
        }
      }
    });
  }

  static updateScenes({ start, error, end }: ScenesOptions) {
    Config.update({
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
