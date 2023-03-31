import { Plugin } from './plugin'
import { Command } from './command'
import { yParser, log, chalk, tapable } from '@etfm/shared'
import { Hook } from './hook'
import assert from 'assert'
import { Api } from './api'
import { Config } from './config'
import { NodeEnv } from '@etfm/types'
import { getPaths } from './path'
import { DEFAULT_FRAMEWORK_NAME } from './constants'

interface IOpts {
  cwd: string
  defaultConfigFiles: string[]
  frameworkName: string
  env: NodeEnv
  plugins?: string[]
}

export enum ApplyHooksType {
  add = 'add',
  modify = 'modify',
  event = 'event',
}

export class Service {
  public plugins: Record<string, Plugin> = {}
  public keyToPluginMap: Record<string, Plugin> = {}
  public commands: Record<string, Command> = {}
  public hooks: Record<string, Hook[]> = {}
  public args: yParser.Arguments = { _: [], $0: '' }
  public opts: IOpts
  public cwd: string
  public skipPluginIds: Set<string> = new Set<string>()
  public config: Record<string, any> = {}
  public env: NodeEnv
  public frameworkName: string
  public paths: Record<string, any> = {}

  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')
    this.opts = opts
    this.cwd = opts.cwd
    this.env = opts.env
    this.frameworkName = opts.frameworkName || DEFAULT_FRAMEWORK_NAME
  }

  applyHooks<T>(opts: {
    key: string
    type: ApplyHooksType
    initialValue?: any
    args?: any
    sync?: boolean
  }): Promise<typeof opts.initialValue | T> | (typeof opts.initialValue | T) {
    assert(opts.key, `key is required`)
    assert(opts.type, `type is required`)

    const hooks = this.hooks[opts.key] || []
    if (opts.type === ApplyHooksType.add) {
      assert(
        !('initialValue' in opts) || Array.isArray(opts.initialValue),
        `applyPlugins failed, opts.initialValue must be Array if opts.type is add.`
      )
      const tAdd = new tapable.AsyncSeriesWaterfallHook(['memo'])
      for (const hook of hooks) {
        if (!this.isPluginEnable(hook)) continue
        tAdd.tapPromise(
          {
            name: hook.plugin.key,
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
    } else if (opts.type === ApplyHooksType.modify) {
      const tModify = new tapable.AsyncSeriesWaterfallHook(['memo'])
      for (const hook of hooks) {
        if (!this.isPluginEnable(hook)) continue
        tModify.tapPromise(
          {
            name: hook.plugin.key,
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
    } else if (opts.type === ApplyHooksType.event) {
      if (opts.sync) {
        const tEvent = new tapable.SyncWaterfallHook(['_'])
        hooks.forEach((hook) => {
          if (this.isPluginEnable(hook)) {
            tEvent.tap(
              {
                name: hook.plugin.key,
                stage: hook.stage || 0,
                before: hook.before,
              },
              () => {
                hook.fn(opts.args)
              }
            )
          }
        })
        return tEvent.call(1) as T
      }
      const tEvent = new tapable.AsyncSeriesWaterfallHook(['_'])
      for (const hook of hooks) {
        if (!this.isPluginEnable(hook)) continue
        tEvent.tapPromise(
          {
            name: hook.plugin.key,
            stage: hook.stage || 0,
            before: hook.before,
          },
          async () => {
            await hook.fn(opts.args)
          }
        )
      }
      return tEvent.promise(1) as Promise<T>
    } else {
      throw new Error(
        `applyPlugins failed, type is not defined or is not matched, got ${opts.type}.`
      )
    }
  }

  async run(commandName: string, args: yParser.Arguments) {
    this.args = args

    // 初始化地址
    this.paths = getPaths({
      cwd: this.cwd,
      prefix: this.frameworkName,
      env: this.env,
    })
    // 获取配置文件信息
    const config = new Config({
      service: this,
      cwd: this.cwd,
      env: this.env,
      defaultConfigFiles: this.opts.defaultConfigFiles,
    })

    this.config = config

    const all_config = config.getConfig()

    console.log('service:run:all_config', all_config)
    // 获取插件
    const plugins = Plugin.getPlugins({
      cwd: this.opts.cwd,
      plugins: this.opts?.plugins,
      config: all_config,
    })

    // 初始化插件并注册插件
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()!, plugins })
    }

    // 收集config一些属性
    await config.setAttrConfig()

    // 开始钩子
    await this.applyHooks({
      key: 'onStart',
      type: ApplyHooksType.event,
    })

    // 执行命令
    const command = this.commands[commandName]
    assert(
      !command,
      `Invalid command ${chalk.red(commandName)}, it's not registered.`
    )

    return (command as unknown as Command).fn({ args })
  }

  private async initPlugin(param: { plugin: Plugin; plugins: Plugin[] }) {
    assert(
      !this.plugins[param.plugin.id],
      `${param.plugin.id} is already registered by ${
        this.plugins[param.plugin.id]?.path
      }`
    )
    this.plugins[param.plugin.id] = param.plugin

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
        'applyHooks',
        'args',
        'config',
        'cwd',
        'paths',
        'isPluginEnable',
        'plugins',
        'hooks',
        'commands',
        'skipPluginIds',
        'env',
        'keyToPluginMap',
      ],
      staticProps: {
        service: this,
      },
    })

    const ret = await param.plugin.apply()(proxyPluginAPI)
    this.keyToPluginMap[param.plugin.key] = param.plugin
    return ret
  }

  // 查看是否启用了插件
  // 因为一些钩子是注册在插件中，因此插件被禁用，那么插件内的一些注册钩子也将失效
  // name 有可能是id（插件id）、hook（hook内注册了plugin，因此可以判断出当前plugin是否启用）
  isPluginEnable(name: any) {
    let plugin: Plugin | undefined
    if ((name as Hook).plugin) {
      plugin = (name as Hook).plugin
    } else {
      plugin = this.plugins[name as string]
      if (!plugin) return false
    }
    const { id, key, enable } = plugin
    if (this.skipPluginIds.has(id)) return false
    if (this.config[key] === false) return false
    if (enable == false) return false
    if (typeof enable === 'function')
      return enable({
        config: this.config,
      })
    return true
  }
}
