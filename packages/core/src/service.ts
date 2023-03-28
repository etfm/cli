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
  public plugins: Record<string, Plugin> = {}
  public commands: Record<string, Command> = {}
  public hooks: Record<string, Hook[]> = {}
  public args: yParser.Arguments = { _: [], $0: '' }
  public opts: IOpts
  public cwd: string

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
    this.cwd = opts.cwd
  }

  applyPlugins<T>(opts: {
    key: string
    type?: ApplyPluginsType.event
    initialValue?: any
    args?: any
    sync: true
  }): typeof opts.initialValue | T
  applyPlugins<T>(opts: {
    key: string
    type?: ApplyPluginsType
    initialValue?: any
    args?: any
  }): Promise<typeof opts.initialValue | T>
  applyPlugins<T>(opts: {
    key: string
    type?: ApplyPluginsType
    initialValue?: any
    args?: any
    sync?: boolean
  }): Promise<typeof opts.initialValue | T> | (typeof opts.initialValue | T) {
    const hooks = this.hooks[opts.key] || []
    let type = opts.type
    // guess type from key
    if (!type) {
      if (opts.key.startsWith('on')) {
        type = ApplyPluginsType.event
      } else if (opts.key.startsWith('modify')) {
        type = ApplyPluginsType.modify
      } else if (opts.key.startsWith('add')) {
        type = ApplyPluginsType.add
      } else {
        throw new Error(
          `Invalid applyPlugins arguments, type must be supplied for key ${opts.key}.`
        )
      }
    }
    switch (type) {
      case ApplyPluginsType.add:
        assert(
          !('initialValue' in opts) || Array.isArray(opts.initialValue),
          `applyPlugins failed, opts.initialValue must be Array if opts.type is add.`
        )
        const tAdd = new tapable.AsyncSeriesWaterfallHook(['memo'])
        for (const hook of hooks) {
          // if (!this.isPluginEnable(hook)) continue
          tAdd.tapPromise(
            {
              // name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async (memo: any) => {
              const items = await hook.fn(opts.args)
              return memo.concat(items)
            }
          )
        }
        return tAdd.promise(opts.initialValue || []) as Promise<T>
      case ApplyPluginsType.modify:
        const tModify = new tapable.AsyncSeriesWaterfallHook(['memo'])
        for (const hook of hooks) {
          // if (!this.isPluginEnable(hook)) continue
          tModify.tapPromise(
            {
              // name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async (memo: any) => {
              const ret = await hook.fn(memo, opts.args)
              return ret
            }
          )
        }
        return tModify.promise(opts.initialValue) as Promise<T>
      case ApplyPluginsType.event:
        if (opts.sync) {
          const tEvent = new tapable.SyncWaterfallHook(['_'])
          // hooks.forEach((hook) => {
          //   if (this.isPluginEnable(hook)) {
          //     tEvent.tap(
          //       {
          //         name: hook.plugin.key,
          //         stage: hook.stage || 0,
          //         before: hook.before,
          //       },
          //       () => {
          //         hook.fn(opts.args)
          //       }
          //     )
          //   }
          // })

          return tEvent.call(1) as T
        }

        const tEvent = new tapable.AsyncSeriesWaterfallHook(['_'])
        for (const hook of hooks) {
          // if (!this.isPluginEnable(hook)) continue
          tEvent.tapPromise(
            {
              // name: hook.plugin.key,
              stage: hook.stage || 0,
              before: hook.before,
            },
            async () => {
              await hook.fn(opts.args)
            }
          )
        }
        return tEvent.promise(1) as Promise<T>
      default:
        throw new Error(
          `applyPlugins failed, type is not defined or is not matched, got ${opts.type}.`
        )
    }
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
