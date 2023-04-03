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
      env: opts?.env || (process.env.NODE_ENV as NodeEnv),
      defaultConfigFiles: DEFAULT_CONFIG_FILES,
      frameworkName: process.env.FRAMEWORK_NAME ?? FRAMEWORK_NAME,
      plugins: [
        require.resolve('@etfm/etfm-plugin-preset'),
        ...(opts?.plugins || []),
      ],
    })
  }

  async start(param: { commandName: string; args: yParser.Arguments }) {
    if (param.args?.v || param.commandName == 'version') {
      param.commandName = 'version'
    } else if (param.args?.h || param.commandName == 'help') {
      param.commandName = 'help'
    }
    return this.run(param.commandName, param.args)
  }
}
