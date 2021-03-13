import { Command } from "./Command";

import setup from "./setup";

import connect from "./connect";
import scenes from "./scenes";
import status from "./status";

import enable from "./enable";
import disable from "./disable";

import help from "./help";
import version from "./version";

export default {
  setup,

  connect,
  scenes,
  status,

  enable,
  disable,

  help,
  version
} as { [key: string]: Command };
