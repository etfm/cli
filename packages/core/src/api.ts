import { Service } from './service'
import { EnableBy, IPluginConfig, Plugin } from './plugin'
import { lodash } from '@etfm/shared'
import { Command, ICommandOpts } from './command'
import assert from 'assert'
import { Hook, IHookOpts } from './hook'

export class Api {
  public service: Service
  public plugin: Plugin

  constructor(param: { service: Service; plugin: Plugin }) {
    this.service = param.service
    this.plugin = param.plugin
  }

  describe(opts: {
    key?: string
    config?: IPluginConfig
    enableBy?:
      | EnableBy
      | ((enableByOpts: { userConfig: any; config: any }) => boolean)
  }) {
    // default 值 + 配置开启冲突，会导致就算用户没有配 key，插件也会生效
    if (opts.enableBy === EnableBy.config && opts.config?.default) {
      throw new Error(
        `[plugin: ${this.plugin.key}] The config.default is not allowed when enableBy is EnableBy.config.`
      )
    }
    this.plugin.merge(opts)
  }

  registerPlugins(source: Plugin[], plugins: any[]) {
    // assert(
    //   this.service.stage === ServiceStage.initPresets ||
    //     this.service.stage === ServiceStage.initPlugins,
    //   `api.registerPlugins() failed, it should only be used in registering stage.`
    // )
    const mappedPlugins = plugins.map((plugin) => {
      if (lodash.isPlainObject(plugin)) {
        assert(
          plugin.id && plugin.key,
          `Invalid plugin object, id and key must supplied.`
        )
        plugin.enableBy = plugin.enableBy || 'register'
        plugin.apply = plugin.apply || (() => () => {})
        return plugin
      } else {
        return new Plugin({
          path: plugin,
          cwd: this.service.cwd,
        })
      }
    })

    source.splice(0, 0, ...mappedPlugins)
  }

  registerCommand(
    param: Omit<ICommandOpts, 'plugin'> & { alias?: string | string[] }
  ) {
    const { alias } = param
    delete param.alias
    const registerCommand = (commandOpts: Omit<typeof param, 'alias'>) => {
      const { name } = commandOpts

      assert(
        !this.service.commands.get(name),
        `api.registerCommand() failed, the command ${name} is exists.`
      )
      this.service.commands.set(
        name,
        new Command({
          ...commandOpts,
          plugin: this.plugin,
        })
      )
    }
    registerCommand(param)
    if (alias) {
      const aliases = Array.isArray(alias) ? alias : [alias]
      aliases.forEach((alias) => {
        registerCommand({ ...param, name: alias })
      })
    }
  }

  registerHook(opts: IHookOpts) {
    this.service.hooks.set(opts.key, [])
    this.service.hooks.get(opts.key)!.push(new Hook(opts))
  }

  skipPlugins(keys: string[]) {
    keys.forEach((key) => {
      assert(!(this.plugin.key === key), `plugin ${key} can't skip itself!`)
      assert(
        this.service.plugins.get(key),
        `key: ${key} is not be registered by any plugin. You can't skip it!`
      )
      this.service.skipPluginKeys.add(key)
    })
  }

  static proxyPluginAPI(opts: {
    pluginAPI: Api
    service: Service
    serviceProps: string[]
    staticProps: Record<string, any>
  }) {
    return new Proxy(opts.pluginAPI, {
      get: (target, prop: string) => {
        if (opts.serviceProps.includes(prop)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const serviceProp = opts.service[prop]
          return typeof serviceProp === 'function'
            ? serviceProp.bind(opts.service)
            : serviceProp
        }
        if (prop in opts.staticProps) {
          return opts.staticProps[prop]
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[prop]
      },
    })
  }
}
