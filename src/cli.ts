import exit from "exit";
import commands from "./cli/commands";
import { logger } from "./utils";

async function run() {
  const [command, ...args] = process.argv.slice(2).map(i => i.toLowerCase());

  const cmd = commands[command];
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

// https://github1s.com/elgatosf/streamdeck-philipshue/blob/master/Sources/com.elgato.philips-hue.sdPlugin/pi/js/scenePI.js
