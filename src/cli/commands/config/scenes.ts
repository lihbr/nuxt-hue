import inquirer from "inquirer";
import exit from "exit";
import { logger } from "../../../utils";
import * as NuxtHue from "../../../core/NuxtHue";
import { Command } from "../Command";
import { Group, Scene } from "../../../core/Bridge";
import { connect } from "./connect";

interface Answers {
  group: Group;
  scenes: NuxtHue.ScenesOptions;
}

export const scenes: Command = {
  name: "Scenes",
  description: `Select scenes Nuxt Hue needs to trigger`,
  usage: "scenes",
  async run(): Promise<void> {
    // Check bridge connexion
    if (!NuxtHue.hasBridge() || !(await NuxtHue.isPaired())) {
      logger.error(
        `Nuxt Hue not connected to a bridge\n\nConnect to one first with:\n  $ ${NuxtHue.CLI_COMMAND} ${connect.usage}`
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
        }), try again:\n\n  $ ${NuxtHue.CLI_COMMAND} ${this.usage}`
      );
      exit(1);
      return;
    }

    // Inquirer config
    let currentScenes: Partial<NuxtHue.ScenesOptions> = {};
    try {
      currentScenes = NuxtHue.getScenes();
    } catch (error) {
      if (error.message !== NuxtHue.Code.ScenesNotConfigured) {
        throw error;
      }
    }
    const when = ({ group }: Answers) =>
      !!scenes.filter(scene => scene.group === group.id).length;
    const choices = ({ group }: Answers) =>
      scenes
        .filter(scene => scene.group === group.id)
        .map(({ name, id }) => ({ name, value: { name, id } }));
    const defaultScene = (
      maybeCurrent?: Partial<Pick<Scene, "id" | "name">>
    ): ((answers: Answers) => number) => {
      if (!maybeCurrent) {
        return () => 0;
      } else {
        return (answers: Answers) => {
          const scenes = choices(answers);
          return Math.max(
            scenes.findIndex(scene => scene.value.id === maybeCurrent.id),
            0
          );
        };
      }
    };
    const prompts = [
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
        default: defaultScene(currentScenes.start),
        loop: false,
        pageSize: 12
      },
      {
        type: "list",
        name: "scenes.error",
        message: "Pick the scene to trigger on Nuxt error:",
        when,
        choices,
        default: defaultScene(currentScenes.error),
        loop: false,
        pageSize: 12
      },
      {
        type: "list",
        name: "scenes.end",
        message: "Pick the scene to trigger when closing Nuxt:",
        when,
        choices,
        default: defaultScene(currentScenes.end),
        loop: false,
        pageSize: 12
      }
    ];

    const answers = await inquirer.prompt<Answers>(prompts);

    // No scenes in chosen group
    if (!when(answers)) {
      logger.error(
        `No scenes found in group: ${answers.group.name}, try again:\n\n  $ ${NuxtHue.CLI_COMMAND} ${this.usage}`
      );
      exit(1);
      return;
    }

    // Save scenes
    NuxtHue.updateScenes(answers.scenes);

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
