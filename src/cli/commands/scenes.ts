import inquirer from "inquirer";
import { NuxtHue, Group, logger, Scene } from "../../utils";
import pkg from "../../../package.json";
import { Command } from "./Command";

enum Code {
  NoSceneInGroup = "No Scene Found in Group"
}

export default {
  name: "Scenes",
  description: `Select scenes Nuxt Hue needs to trigger`,
  usage: "scenes",
  async run(): Promise<void> {
    if (!NuxtHue.hasBridge() || !NuxtHue.isPaired()) {
      logger.warn(
        `Nuxt Hue not connected to a bridge\n\nConnect to one first with:\n  $ ${pkg.name} connect`
      );
      return;
    }

    const bridge = NuxtHue.getBridge();

    const [groups, scenes] = await Promise.all([
      bridge.getGroups(),
      bridge.getScenes()
    ]);

    // TODO: Handle no groups
    // TODO: Handle no scenes

    interface Answers {
      group: Group;
      scenes: {
        start: Scene;
        error: Scene;
        end: Scene;
      };
    }
    const when = ({ group }: Answers) =>
      !!scenes.filter(scene => scene.group === group.id).length;
    const choices = ({ group }: Answers) =>
      scenes
        .filter(scene => scene.group === group.id)
        .map(scene => ({ name: scene.name, value: scene }));

    const answers = await inquirer.prompt<Answers>([
      {
        type: "list",
        name: "group",
        message: "Pick the group (room) that Nuxt Hue needs to manage:",
        choices: groups.map(group => ({ name: group.name, value: group })),
        loop: false,
        pageSize: 12
      },
      {
        type: "list",
        name: "scenes.start",
        message: "Pick the scene to trigger when starting Nuxt:",
        when,
        choices,
        loop: false,
        pageSize: 12
      },
      {
        type: "list",
        name: "scenes.error",
        message: "Pick the scene to trigger on Nuxt error:",
        when,
        choices,
        loop: false,
        pageSize: 12
      },
      {
        type: "list",
        name: "scenes.end",
        message: "Pick the scene to trigger when closing Nuxt:",
        when,
        choices,
        loop: false,
        pageSize: 12
      }
    ]);

    if (when(answers)) {
      await bridge.triggerScene(answers.scenes.start.id);
      // TODO: Save scenes
      logger.success("\nSuccess");
    } else {
      logger.error(Code.NoSceneInGroup);
    }
  }
} as Command;
