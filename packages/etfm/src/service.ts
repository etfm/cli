import { Service as Core } from '@etfm/core'
import { yParser } from '@etfm/shared'

function getCwd() {
  return process.cwd()
}

export class Service extends Core {
  constructor(opts?: Record<string, any>) {
    const cwd = getCwd()

    super({
      ...opts,
      cwd,
      plugins: [require.resolve('@etfm/etfm-plugin-version')],
    })
  }

  async start(commandName: string, args: yParser.Arguments) {
    if (args?.v || commandName == 'version') {
      commandName = 'version'
    } else if (args?.h || commandName == 'help') {
      commandName = 'help'
    }
    return this.run(commandName, args)
  }
}
