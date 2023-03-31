import { Service as Core } from '@etfm/core'
import { yParser } from '@etfm/shared'
import { DEFAULT_CONFIG_FILES, FRAMEWORK_NAME } from './constants'
import { NodeEnv } from '@etfm/types'

function getCwd() {
  return process.cwd()
}

export class Service extends Core {
  constructor(opts?: Record<string, any>) {
    const cwd = getCwd()

    super({
      ...opts,
      cwd,
      env: process.env.NODE_ENV as NodeEnv,
      defaultConfigFiles: DEFAULT_CONFIG_FILES,
      frameworkName: process.env.FRAMEWORK_NAME ?? FRAMEWORK_NAME,
      plugins: [
        require.resolve('@etfm/etfm-plugin-version'),
        require.resolve('@etfm/etfm-plugin-config'),
      ],
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
