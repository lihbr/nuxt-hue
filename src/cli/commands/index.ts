import * as configCommands from "./config"
import * as moduleCommands from "./module"
import * as internalCommands from "./internal"
import * as miscCommands from "./misc"
import type { Command } from "./Command"

export type { Command } from "./Command"

export default {
	...configCommands,
	...moduleCommands,
	...miscCommands,
	...internalCommands,
} as { [key: string]: Command }
