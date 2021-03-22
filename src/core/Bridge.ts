import fetch, { RequestInit } from "node-fetch";
import execa from "execa";
import { logger } from "../utils";

export interface Group {
  id: string;
  name: string;
  type: string;
}

export interface Scene {
  id: string;
  name: string;
  group: string;
  type: string;
}

export enum Code {
  NoBridgeFound = "No Bridges Found",
  PairingTimeout = "Pairing Timeout",
  NotPaired = "Not Paired",
  NoGroups = "No Groups Found",
  NoScenes = "No Scenes Found",
  NoScenesInGroup = "No Scenes Found in Group"
}

enum Method {
  Get = "GET",
  Post = "POST",
  Put = "PUT",
  Delete = "DELETE"
}

export class Bridge {
  static HUE_DISCOVERY = "https://discovery.meethue.com";
  static PAIRING_TIMEOUT = 45000;
  static API_TIMEOUT = 6000;

  /**
   * Query MeetHue API
   */
  static async query<T, Body = any>(
    endpoint: string,
    method: Method = Method.Get,
    body?: Body
  ): Promise<T> {
    const options: RequestInit = {
      method,
      timeout: Bridge.API_TIMEOUT
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, options);
    return (await res.json()) as T;
  }

  /**
   * Discover bridges on the current network
   */
  static async discoverBridges(): Promise<Bridge[]> {
    interface BridgeInformation {
      id: string;
      internalipaddress: string;
    }

    const json = await Bridge.query<BridgeInformation[]>(Bridge.HUE_DISCOVERY);

    return json.map(({ id, internalipaddress: ip }) => new Bridge(ip, id));
  }

  /**
   * Pair with any of the provided bridges (FIFO) with given device type
   */
  static pairAny(bridges: Bridge[], devicetype: string): Promise<Bridge> {
    let elapsed = 0;
    return new Promise((resolve, reject) => {
      const timer = setInterval(() => {
        if (elapsed < Bridge.PAIRING_TIMEOUT) {
          bridges.forEach(async bridge => {
            const maybePairedBridge = await bridge.attemptPairing(devicetype);

            if (maybePairedBridge) {
              clearInterval(timer);
              resolve(maybePairedBridge);
            }
          });
          elapsed += 1000;
        } else {
          clearInterval(timer);
          reject(new Error(Code.PairingTimeout));
        }
      }, 1000);
    });
  }

  username: string;

  get api(): string {
    return `http://${this.ip}/api`;
  }

  constructor(public ip: string, public id: string, username: string = "") {
    this.username = username;
  }

  async attemptPairing(devicetype: string): Promise<Bridge | false> {
    interface PairingResponse {
      success?: {
        username: string;
      };
      error?: any;
    }

    const json = (
      await Bridge.query<PairingResponse[]>(this.api, Method.Post, {
        devicetype
      })
    )[0];

    if (json.success) {
      this.username = json.success.username;
      return this;
    } else {
      return false;
    }
  }

  async isPaired(): Promise<boolean> {
    if (!this.username) {
      return false;
    }

    const json = await Bridge.query<{ whitelist?: any }>(
      `${this.api}/${this.username}/config`
    );

    return !!json.whitelist;
  }

  private async getObject<T>(object: string): Promise<T[]> {
    if (!this.isPaired()) {
      throw new Error(Code.NotPaired);
    }

    const json = await Bridge.query<{ [key: string]: T }>(
      `${this.api}/${this.username}/${object}`
    );

    return Object.keys(json).map(key => ({ ...json[key], id: key }));
  }

  async getGroups(): Promise<Group[]> {
    return (await this.getObject<Group>("groups")).filter(
      group => group.type !== "Entertainment"
    );
  }

  async getScenes(): Promise<Scene[]> {
    return (await this.getObject<Scene>("scenes")).filter(
      scene => scene.type === "GroupScene"
    );
  }

  async triggerScene(
    sceneId?: string,
    failGracefully: boolean = true
  ): Promise<void> {
    if (!sceneId) {
      return;
    }

    try {
      await Bridge.query(
        `${this.api}/${this.username}/groups/0/action`,
        Method.Put,
        { scene: sceneId }
      );
    } catch (error) {
      if (failGracefully) {
        logger.warn(error);
      } else {
        throw error;
      }
    }
  }

  triggerSceneExec(sceneId?: string, failGracefully: boolean = true): void {
    if (!sceneId) {
      return;
    }

    try {
      execa.sync("nuxt-hue", ["trigger-scene", sceneId]);
    } catch (error) {
      if (failGracefully) {
        logger.warn(error);
      } else {
        throw error;
      }
    }
  }
}
