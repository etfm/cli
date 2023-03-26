import { Plugin } from './plugin'
import { Command } from './command'
import { yParser, log, chalk } from '@etfm/shared'
import { Hook } from './hook'
import assert from 'assert'

interface IOpts {
  cwd: string
  plugins?: string[]
}

export class Service {
  public plugins: Record<string, Plugin> = {}
  public commands: Record<string, Command> = {}
  public hooks: Record<string, Hook> = {}
  public args: yParser.Arguments = { _: [], $0: '' }
  public opts: IOpts

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
  }

  async run(commandName: string, args: yParser.Arguments) {
    this.args = args
    // 获取插件
    const plugins = Plugin.getPlugins({
      cwd: this.opts.cwd,
      plugins: this.opts?.plugins,
    })

    console.log('service:run', plugins)
    // 初始化插件并注册插件
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()!, plugins })
    }
    // 执行命令
    const command = this.commands[commandName]
    assert(
      !command,
      `Invalid command ${chalk.red(commandName)}, it's not registered.`
    )

    return (command as Command).fn({ args })
  }

  private async initPlugin(param: { plugin: Plugin; plugins: Plugin[] }) {
    console.log(param)
  }
}
