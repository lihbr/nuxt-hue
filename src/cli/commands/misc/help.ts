import chalk from "chalk";
import pkg from "../../../../package.json";
import { logger } from "../../../utils";
import { NuxtHue } from "../../../core";
import { Command } from "../Command";
import * as configCommands from "../config";
import * as moduleCommands from "../module";
import { version } from "./version";

const SPACER = "__spacer";
const ORDER: string[] = [
  "setup",
  SPACER,
  "connect",
  "scenes",
  "status",
  SPACER,
  "enable",
  "disable",
  SPACER,
  "help",
  "version"
];

async function getStatus(): Promise<string> {
  if (NuxtHue.hasBridge() && (await NuxtHue.isPaired())) {
    return `Nuxt Hue is ${
      NuxtHue.isEnabled() ? "enabled" : "disabled"
    } and connected to a bridge (${NuxtHue.getBridge().ip})`;
  } else {
    return `Nuxt Hue is ${
      NuxtHue.isEnabled() ? "enabled" : "disabled"
    } but not connected to a bridge`;
  }
}

function getCommandHelp(
  { description, usage }: Command,
  usageMaxLength: number = 0
): string {
  return `  ${usage}  ${" ".repeat(
    Math.max(usageMaxLength - usage.length, 0)
  )}${description
    .split("\n")
    .join(`\n    ${" ".repeat(Math.max(usageMaxLength, 0))}`)}`;
}

function getCommandsHelp(commands: { [key: string]: Command }): string {
  const commandsHelp = [];
  const usageMaxLength = Math.max(
    ...Object.keys(commands).map(key => commands[key].usage.length)
  );

  ORDER.forEach(key => {
    if (key === SPACER) {
      commandsHelp.push("");
    } else {
      commandsHelp.push(getCommandHelp(commands[key], usageMaxLength));
    }
  });
  commandsHelp.push("");
  for (const key in commands) {
    if (!ORDER.includes(key)) {
      commandsHelp.push(getCommandHelp(commands[key], usageMaxLength));
    }
  }

  if (commandsHelp[commandsHelp.length - 1] === "") {
    commandsHelp.pop();
  }

  return commandsHelp.join("\n");
}

export const help: Command = {
  name: "Help",
  description: `Display help for ${pkg.name}`,
  usage: "help, --help, -h",
  async run(): Promise<void> {
    const miscCommands = {
      version,
      help: this
    };

    const header = `💡 Nuxt Hue CLI\n${chalk.cyanBright(
      "Read the docs:"
    )} https://nuxt-hue.lihbr.com\n${chalk.yellowBright(
      "More from Lucie:"
    )} https://lihbr.com — https://twitter.com/li_hbr`;
    const intro = "Nuxt Hue command line tool";
    const status = `STATUS\n  ${await getStatus()}`;
    const meta = `VERSION\n  ${pkg.name}@${pkg.version}`;
    const usage = `USAGE\n  $ ${pkg.name} [COMMAND]`;
    const commands = `COMMANDS\n${getCommandsHelp({
      ...configCommands,
      ...moduleCommands,
      ...miscCommands
    })}`;

    logger.log(
      `\n${[header, intro, status, meta, usage, commands].join("\n\n")}\n`
    );
  }
};
