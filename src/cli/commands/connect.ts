import Listr, { ListrTaskWrapper } from "listr";
import { Observable } from "rxjs";
import { Bridge, Config, logger } from "../../utils";
import pkg from "../../../package.json";
import { Command } from "./Command";

const DEVICE_TYPE = "nuxt-hue";

interface ConnectContext {
  bridges: Bridge[];
  pairedBridge: Bridge;
}

enum CODES {
  NO_BRIDGES_FOUND = "No Bridges Found"
}

export const tasks = new Listr([
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
              observer.error(new Error(CODES.NO_BRIDGES_FOUND));
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
      Config.updateBridge(ctx.pairedBridge);
      task.title = "Bridge Added Successfully";
    }
  }
]);

export default {
  name: "Connect",
  description: "Connect to a new bridge",
  usage: "connect",
  async run(): Promise<any> {
    try {
      await tasks.run();
    } catch (error) {
      logger.log(
        `\n${error.message || error}, try again:\n\n  $ ${pkg.name} connect`
      );
    }
  }
} as Command;
