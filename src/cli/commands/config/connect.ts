// @ts-ignore
import UpdateRenderer from "@lihbr/listr-update-renderer";
import Listr, { ListrTaskWrapper } from "listr";
import { Observable } from "rxjs";
import exit from "exit";
import { logger } from "../../../utils";
import * as NuxtHue from "../../../core/NuxtHue";
import { Command } from "../Command";
import { Bridge, Code as BridgeCode } from "../../../core/Bridge";

const DEVICE_TYPE = "nuxt-hue";

interface ConnectContext {
  bridges: Bridge[];
  pairedBridge: Bridge;
}

const tasks = new Listr(
  [
    {
      title: "Discovering Bridges...",
      task: (ctx: ConnectContext, task: ListrTaskWrapper) =>
        new Observable(observer => {
          observer.next(
            "Make sure your bridge is switched on and connected to the network"
          );

          Promise.all([
            Bridge.discoverBridges(),
            new Promise(resolve => setTimeout(resolve, 1500))
          ])
            .then(([bridges, _]) => {
              if (bridges.length === 0) {
                observer.error(new Error(BridgeCode.NoBridgeFound));
              } else {
                if (bridges.length === 1) {
                  task.title = "One Bridge Found";
                } else {
                  task.title = `${bridges.length} Bridges Found`;
                }
                ctx.bridges = bridges;
                observer.complete();
              }
            })
            .catch(error => {
              observer.error(error);
            });
        })
    },
    {
      title: "Pairing...",
      task: (ctx: ConnectContext, task: ListrTaskWrapper) =>
        new Observable(observer => {
          observer.next(
            `Please go press the link button on the bridge${
              ctx.bridges.length > 1 ? " of your choice now" : ""
            } to pair`
          );

          Bridge.pairAny(ctx.bridges, DEVICE_TYPE)
            .then(bridge => {
              task.title = `Paired with bridge: ${bridge.ip}`;
              ctx.pairedBridge = bridge;
              observer.complete();
            })
            .catch(error => {
              observer.error(error);
            });
        })
    },
    {
      title: "Saving Bridge...",
      task: (ctx: ConnectContext, task: ListrTaskWrapper) => {
        NuxtHue.updateBridge(ctx.pairedBridge);
        task.title = "Bridge saved";
      }
    }
  ],
  { renderer: UpdateRenderer }
);

export const connect: Command = {
  name: "Connect",
  description: "Connect to a new bridge",
  usage: "connect",
  async run(_, { programmatic = false } = {}): Promise<any> {
    try {
      await tasks.run();

      if (!programmatic && !NuxtHue.isEnabled()) {
        NuxtHue.enable();
        logger
          // @ts-ignore
          .withDefaults({ badge: true })
          .success(
            "Connect setup completed successfully, Nuxt Hue has also been enabled"
          );
      } else {
        logger
          // @ts-ignore
          .withDefaults({ badge: true })
          .success("Connect setup completed successfully");
      }
    } catch (error) {
      switch (error.message) {
        case BridgeCode.NoBridgeFound:
        case BridgeCode.PairingTimeout:
          logger.error(
            `${error.message}, try again:\n\n  $ ${NuxtHue.CLI} ${this.usage}`
          );
          exit(1);
          break;

        default:
          throw error;
      }
    }
  }
};
