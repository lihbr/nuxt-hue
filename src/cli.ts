import exit from 'exit'

import commands from './cli/commands'
import { logger, kebabTopascalCase } from './utils'

async function run () {
	const [command, ...args] = process.argv.slice(2)

	const cmd = commands[kebabTopascalCase(command)]
	if (cmd) {
		await cmd.run(args)
	} else {
		switch (command) {
			case '--version':
			case '-v':
				await commands.version.run()
				break

			case '--help':
			case '-h':
			default:
				await commands.help.run()
				break
		}
	}
}

run().catch((error) => {
	logger.fatal(error)
	exit(2)
})
