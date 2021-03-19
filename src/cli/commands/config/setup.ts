import { Command } from "../Command";
import { connect } from "./connect";
import { scenes } from "./scenes";

export const setup: Command = {
  name: "Setup",
  description: `Connect to a bridge and select scenes Nuxt Hue\nneeds to trigger, useful after first installation`,
  usage: "setup",
  async run(): Promise<any> {
    await connect.run([], { programmatic: true });
    await scenes.run([], { programmatic: true });
  }
};
