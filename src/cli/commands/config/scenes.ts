import inquirer from "inquirer";
import exit from "exit";
import chalk from "chalk";
import pkg from "../../../../package.json";
import { logger } from "../../../utils";
import { Group, NuxtHue, ScenesOptions } from "../../../core";
import { Command } from "../Command";
import { connect } from "./connect";

interface Answers {
  group: Group;
  scenes: ScenesOptions;
}

export const scenes: Command = {
  name: "Scenes",
  description: `Select scenes Nuxt Hue needs to trigger`,
  usage: "scenes",
  async run(): Promise<void> {
    // Check bridge connexion
    if (!NuxtHue.hasBridge() || !NuxtHue.isPaired()) {
      logger.error(
        `Nuxt Hue not connected to a bridge\n\nConnect to one first with:\n  $ ${pkg.name} ${connect.usage}`
      );
      exit(1);
      return;
    }

    const bridge = NuxtHue.getBridge();
    const [groups, scenes] = await Promise.all([
      bridge.getGroups(),
      bridge.getScenes()
    ]);

    // Check for groups and bridges
    if (!groups.length || !scenes.length) {
      logger.error(
        `No ${!groups.length ? "groups" : "scenes"} found for current bridge (${
          bridge.ip
        }), try again:\n\n  $ ${pkg.name} ${this.usage}`
      );
      exit(1);
      return;
    }

    // Inquirer config
    const when = ({ group }: Answers) =>
      !!scenes.filter(scene => scene.group === group.id).length;
    const choices = ({ group }: Answers) =>
      scenes
        .filter(scene => scene.group === group.id)
        .map(({ name, id }) => ({ name, value: { name, id } }));
    const prefix = `  ${chalk.green("?")}`;
    const prompts = [
      {
        type: "list",
        name: "group",
        message: "Pick the group (room) that Nuxt Hue needs to manage:",
        choices: groups.map(group => ({ name: group.name, value: group })),
        loop: false,
        pageSize: 12,
        prefix
      },
      {
        type: "list",
        name: "scenes.start",
        message: "Pick the scene to trigger when starting Nuxt:",
        when,
        choices,
        loop: false,
        pageSize: 12,
        prefix
      },
      {
        type: "list",
        name: "scenes.error",
        message: "Pick the scene to trigger on Nuxt error:",
        when,
        choices,
        loop: false,
        pageSize: 12,
        prefix
      },
      {
        type: "list",
        name: "scenes.end",
        message: "Pick the scene to trigger when closing Nuxt:",
        when,
        choices,
        loop: false,
        pageSize: 12,
        prefix
      }
    ];

    const answers = await inquirer.prompt<Answers>(prompts);

    // No scenes in chosen group
    if (!when(answers)) {
      logger.error(
        `No scenes found in group: ${answers.group.name}, try again:\n\n  $ ${pkg.name} ${this.usage}`
      );
      exit(1);
      return;
    }

    // Save scenes
    NuxtHue.updateScenes(answers.scenes);

    // TODO: Remove
    await bridge.triggerScene(answers.scenes.start.id);

    if (!NuxtHue.isEnabled()) {
      NuxtHue.enable();
      logger
        // @ts-ignore
        .withDefaults({ badge: true })
        .success(
          "Scenes setup completed successfully, Nuxt Hue has also been enabled"
        );
    } else {
      logger
        // @ts-ignore
        .withDefaults({ badge: true })
        .success("Scenes setup completed successfully");
    }
  }
};
