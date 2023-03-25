import { Plugin } from './plugin'
import { Command } from './command'
import { yParser, log } from '@etfm/shared'
import { Hook } from './hook'

interface IOpts {
  cwd: string
  plugins?: string[]
}

export class Service {
  public plugins: Record<string, Plugin> = {}
  public commands: Record<string, Command> = {}
  public hooks: Record<string, Hook> = {}
  public argvs: yParser.Arguments = { _: [], $0: '' }
  public opts: IOpts

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
  }

  async run(commandName: string, argvs: Record<string, any>) {
    console.log(commandName, argvs)
    // 获取要执行命令
    // 获取插件
    const plugins = Plugin.getPlugins({
      cwd: this.opts.cwd,
      plugins: this.opts?.plugins,
    })
    // 初始化插件并注册插件
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()!, plugins })
    }
    // 注册插件

    // 执行命令
  }

  private async initPlugin(param: { plugin: Plugin; plugins: Plugin[] }) {
    console.log(param)
  }
}
