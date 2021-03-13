import exit from "exit";
import commands from "./cli/commands";
import { logger } from "./utils";

async function run() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [command, ...args] = process.argv.slice(2).map(i => i.toLowerCase());

  const cmd = commands[command];
  if (cmd) {
    await cmd.run();
  } else {
    switch (command) {
      case "--version":
      case "-v":
        await commands.version.run();
        break;

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
