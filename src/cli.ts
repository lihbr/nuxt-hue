import exit from "exit";
import commands from "./cli/commands";
import { logger } from "./utils";

async function run() {
  const [command, ...args] = process.argv.slice(2);

  const cmd =
    commands[
      command
        .toLowerCase()
        .split("-")
        .map((s, i) => (i === 0 ? s : `${s[0].toUpperCase()}${s.slice(1)}`))
        .join("")
    ];
  if (cmd) {
    await cmd.run(args);
  } else {
    switch (command) {
      case "--version":
      case "-v":
        await commands.version.run();
        break;

      case "--help":
      case "-h":
      default:
        await commands.help.run();
        break;
    }
  }
}

run().catch(error => {
  logger.fatal(error);
  exit(2);
});
