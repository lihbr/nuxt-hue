import * as configCommands from "./config";
import * as moduleCommands from "./module";
import * as miscCommands from "./misc";
import { Command } from "./Command";

export { Command } from "./Command";

export default {
  ...configCommands,
  ...moduleCommands,
  ...miscCommands
} as { [key: string]: Command };
