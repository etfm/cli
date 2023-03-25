import { Service as Core } from '@etfm/core'

export class Service extends Core {
  constructor(opts?: any) {
    console.log(opts)
    super()
  }

  async start(commandName: string, argvs: Record<string, any>) {
    if (argvs?.v || commandName == 'version') {
      commandName = 'version'
    } else if (argvs?.h || commandName == 'help') {
      commandName = 'help'
    }
    return this.run(commandName, argvs)
  }
}
