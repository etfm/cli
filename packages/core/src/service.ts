import { Plugin } from './plugin'
import { Command } from './command'
import { yParser, log, chalk } from '@etfm/shared'
import { Hook } from './hook'
import assert from 'assert'
import { Api } from './api'

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
  public cwd: string

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
    this.cwd = opts.cwd
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
    // assert(
    //   !this.plugins[param.plugin.id],
    //   `${param.plugin.id} is already registered by ${
    //     this.plugins[param.plugin.id]?.path
    //   },  ${param.plugin.path} register failed.`
    // )
    this.plugins[param.plugin.id] = param.plugin

    const pluginAPI = new Api({
      plugin: param.plugin,
      service: this,
    })
    console.log(pluginAPI, '----------')

    pluginAPI.registerPlugins = pluginAPI.registerPlugins.bind(
      pluginAPI,
      param.plugins
    )

    const proxyPluginAPI = Api.proxyPluginAPI({
      service: this,
      pluginAPI,
      serviceProps: [
        'appData',
        'applyPlugins',
        'args',
        'config',
        'cwd',
        'pkg',
        'pkgPath',
        'name',
        'paths',
        'userConfig',
        'env',
        'isPluginEnable',
      ],
      staticProps: {
        service: this,
      },
    })

    const ret = await param.plugin.apply()(proxyPluginAPI)

    return ret
  }
}
