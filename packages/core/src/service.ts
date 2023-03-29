import { Plugin } from './plugin'
import { Command } from './command'
import { yParser, log, chalk, tapable } from '@etfm/shared'
import { Hook } from './hook'
import assert from 'assert'
import { Api } from './api'

interface IOpts {
  cwd: string
  plugins?: string[]
}

export enum ApplyPluginsType {
  add = 'add',
  modify = 'modify',
  event = 'event',
}

export class Service {
  public plugins: Map<string, Plugin> = new Map()
  public commands: Map<string, Command> = new Map<string, Command>()
  public hooks: Map<string, Hook[]> = new Map()
  public args: yParser.Arguments = { _: [], $0: '' }
  public opts: IOpts
  public cwd: string

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
    this.cwd = opts.cwd
  }

  // applyPlugins<T>(opts: {
  //   key: string
  //   type: ApplyPluginsType
  //   initialValue?: any
  //   args?: any
  //   sync?: boolean
  // }): Promise<typeof opts.initialValue | T> | (typeof opts.initialValue | T) {
  //   assert(opts.key, `key is required`)
  //   assert(opts.type, `type is required`)
  //
  //   const hooks = this.hooks[opts.key] || []
  //   if (opts.type === ApplyPluginsType.add) {
  //     assert(
  //       !('initialValue' in opts) || Array.isArray(opts.initialValue),
  //       `applyPlugins failed, opts.initialValue must be Array if opts.type is add.`
  //     )
  //     const tAdd = new tapable.AsyncSeriesWaterfallHook(['memo'])
  //     for (const hook of hooks) {
  //       // if (!this.isPluginEnable(hook)) continue
  //       tAdd.tapPromise(
  //         {
  //           name: hook.plugin.key,
  //           stage: hook.stage || 0,
  //           before: hook.before,
  //         },
  //         async (memo: any) => {
  //           const items = await hook.fn(opts.args)
  //           return memo.concat(items)
  //         }
  //       )
  //     }
  //     return tAdd.promise(opts.initialValue || []) as Promise<T>
  //   } else if (opts.type === ApplyPluginsType.modify) {
  //     const tModify = new tapable.AsyncSeriesWaterfallHook(['memo'])
  //     for (const hook of hooks) {
  //       // if (!this.isPluginEnable(hook)) continue
  //       tModify.tapPromise(
  //         {
  //           name: hook.plugin.key,
  //           stage: hook.stage || 0,
  //           before: hook.before,
  //         },
  //         async (memo: any) => {
  //           const ret = await hook.fn(memo, opts.args)
  //           return ret
  //         }
  //       )
  //     }
  //     return tModify.promise(opts.initialValue) as Promise<T>
  //   } else if (opts.type === ApplyPluginsType.event) {
  //     if (opts.sync) {
  //       const tEvent = new tapable.SyncWaterfallHook(['_'])
  //       hooks.forEach((hook) => {
  //         if (this.isPluginEnable(hook)) {
  //           tEvent.tap(
  //             {
  //               name: hook.plugin.key,
  //               stage: hook.stage || 0,
  //               before: hook.before,
  //             },
  //             () => {
  //               hook.fn(opts.args)
  //             }
  //           )
  //         }
  //       })
  //       return tEvent.call(1) as T
  //     }
  //     const tEvent = new tapable.AsyncSeriesWaterfallHook(['_'])
  //     for (const hook of hooks) {
  //       // if (!this.isPluginEnable(hook)) continue
  //       tEvent.tapPromise(
  //         {
  //           name: hook.plugin.key,
  //           stage: hook.stage || 0,
  //           before: hook.before,
  //         },
  //         async () => {
  //           await hook.fn(opts.args)
  //         }
  //       )
  //     }
  //     return tEvent.promise(1) as Promise<T>
  //   } else {
  //     throw new Error(
  //       `applyPlugins failed, type is not defined or is not matched, got ${opts.type}.`
  //     )
  //   }
  // }

  async run(commandName: string, args: yParser.Arguments) {
    this.args = args
    // 获取插件
    const plugins = Plugin.getPlugins({
      cwd: this.opts.cwd,
      plugins: this.opts?.plugins,
    })

    // 初始化插件并注册插件
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()!, plugins })
    }
    // 执行命令
    const command = this.commands.get(commandName)
    assert(
      !command,
      `Invalid command ${chalk.red(commandName)}, it's not registered.`
    )

    return (command as unknown as Command).fn({ args })
  }

  private async initPlugin(param: { plugin: Plugin; plugins: Plugin[] }) {
    assert(
      !this.plugins.get(param.plugin.key),
      `${param.plugin.key} is already registered by ${
        this.plugins.get(param.plugin.key)?.path
      }`
    )
    this.plugins.set(param.plugin.key, param.plugin)

    const pluginAPI = new Api({
      plugin: param.plugin,
      service: this,
    })

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

  // isPluginEnable(hook: Hook | string) {
  //   let plugin: Plugin
  //   if ((hook as Hook).plugin) {
  //     plugin = (hook as Hook).plugin
  //   } else {
  //     plugin = this.keyToPluginMap[hook as string]
  //     if (!plugin) return false
  //   }
  //   const { id, key, enableBy } = plugin
  //   if (this.skipPluginIds.has(id)) return false
  //   if (this.userConfig[key] === false) return false
  //   if (this.config[key] === false) return false
  //   if (enableBy === EnableBy.config) {
  //     // TODO: 提供单独的命令用于启用插件
  //     // this.userConfig 中如果存在，启用
  //     // this.config 好了之后如果存在，启用
  //     // this.config 在 modifyConfig 和 modifyDefaultConfig 之后才会 ready
  //     // 这意味着 modifyConfig 和 modifyDefaultConfig 只能判断 api.userConfig
  //     // 举个具体场景:
  //     //   - p1 enableBy config, p2 modifyDefaultConfig p1 = {}
  //     //   - p1 里 modifyConfig 和 modifyDefaultConfig 仅 userConfig 里有 p1 有效，其他 p2 开启时即有效
  //     //   - p2 里因为用了 modifyDefaultConfig，如果 p2 是 enableBy config，需要 userConfig 里配 p2，p2 和 p1 才有效
  //     return key in this.userConfig || (this.config && key in this.config)
  //   }
  //   if (typeof enableBy === 'function')
  //     return enableBy({
  //       userConfig: this.userConfig,
  //       config: this.config,
  //       env: this.env,
  //     })
  //   // EnableBy.register
  //   return true
  // }
}
