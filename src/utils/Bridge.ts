// @ts-ignore-next-line
import fetch from "node-fetch";

enum CODES {
  PAIRING_TIMEOUT = "Pairing Timeout",
  NOT_PAIRED = "Not Paired"
}

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

export class Bridge {
  static HUE_DISCOVERY = "https://discovery.meethue.com";
  static PAIRING_TIMEOUT = 4500;
  static CODES = CODES;

  static async discoverBridges(): Promise<Bridge[]> {
    const res = await fetch(Bridge.HUE_DISCOVERY);
    const json = (await res.json()) as {
      id: string;
      internalipaddress: string;
    }[];

    return json.map(({ id, internalipaddress: ip }) => new Bridge(ip, id));
  }

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
          reject(new Error(Bridge.CODES.PAIRING_TIMEOUT));
        }
      }, 1000);
    });
  }

  username?: string;
  paired?: boolean;

  get api(): string {
    return `http://${this.ip}/api`;
  }

  constructor(public ip?: string, public id?: string, username?: string) {
    this.username = username;
    this.paired = !!this.username;
  }

  async attemptPairing(devicetype: string): Promise<Bridge | false> {
    const res = await fetch(this.api, {
      method: "POST",
      timeout: 2500,
      body: JSON.stringify({ devicetype })
    });
    const json = (await res.json())[0];

    if (json.success) {
      this.username = json.success.username;
      this.paired = true;

      return this;
    } else {
      return false;
    }
  }

  async isPaired(): Promise<boolean> {
    if (!this.isPaired) {
      return false;
    }

    const res = await fetch(`${this.api}/${this.username}/config`, {
      method: "GET",
      timeout: 2500
    });
    const json = await res.json();

    return !!json.whitelist;
  }

  private async getObject<T>(object): Promise<T[]> {
    if (!this.isPaired()) {
      throw new Error(Bridge.CODES.NOT_PAIRED);
    }

    const res = await fetch(`${this.api}/${this.username}/${object}`, {
      method: "GET",
      timeout: 2500
    });
    const json = await res.json();

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

  async triggerScene(sceneId: string): Promise<void> {
    const res = await fetch(`${this.api}/${this.username}/groups/0/action`, {
      method: "PUT",
      timeout: 2500,
      body: JSON.stringify({ scene: sceneId })
    });
    const json = await res.json();
    console.log(json);
  }
}
