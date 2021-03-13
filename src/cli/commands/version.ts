import { logger } from "../../utils";
import pkg from "../../../package.json";
import { Command } from "./Command";

export default {
  name: "Version",
  description: `Display ${pkg.name} version`,
  usage: "version, --version, -v",
  run(): void {
    logger.log(`${pkg.name}@${pkg.version}`);
  }
} as Command;
