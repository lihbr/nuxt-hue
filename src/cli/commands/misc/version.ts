import pkg from "../../../../package.json";
import { logger } from "../../../utils";
import { Command } from "../Command";

export const version: Command = {
  name: "Version",
  description: `Display ${pkg.name} installed version`,
  usage: "version, --version, -v",
  run(): void {
    logger.log(`${pkg.name}@${pkg.version}`);
  }
};
