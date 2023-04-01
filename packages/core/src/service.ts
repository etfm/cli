import { getPlugins, Plugin } from './plugin'
import { Command } from './command'
import { yParser, log, chalk, tapable } from '@etfm/shared'
import { Hook } from './hook'
import assert from 'assert'
import { Api } from './api'
import { Config } from './config'
import { NodeEnv } from '@etfm/types'
import { getPaths } from './path'
import { DEFAULT_FRAMEWORK_NAME } from './constants'
import { ServiceStage } from './types'
import { loadEnv } from './env'
import { join } from 'path'

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
  public env: NodeEnv
  public frameworkName: string
  public paths: Record<string, any> = {}
  public config: Config
  public stage: ServiceStage = ServiceStage.uninitialized
  public pkg: Record<string, any> = {}
  public pkgPath = ''
  constructor(opts: IOpts) {
    log.verbose('Service:', opts ? JSON.stringify(opts) : '')

    this.opts = opts
    this.cwd = opts.cwd
    this.env = opts.env
    this.frameworkName = opts.frameworkName || DEFAULT_FRAMEWORK_NAME
    this.config = new Config({
      service: this,
      cwd: opts.cwd,
      env: opts.env,
      defaultConfigFiles: opts.defaultConfigFiles,
    })
  }

  applyHooks<T>(opts: {
    key: string
    type: ApplyHooksType.event
    initialValue?: any
    args?: any
    sync: true
  }): typeof opts.initialValue | T
  applyHooks<T>(opts: {
    key: string
    type: ApplyHooksType
    initialValue?: any
    args?: any
  }): Promise<typeof opts.initialValue | T>
  applyHooks<T>(opts: {
    key: string
    type: ApplyHooksType
    initialValue?: any
    args?: any
    sync?: boolean
  }): Promise<typeof opts.initialValue | T> | (typeof opts.initialValue | T) {
    assert(opts.key, `key is required`)
    assert(opts.type, `type is required`)

    log.verbose('Service:applyHooks:opts', JSON.stringify(opts))
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
            return await hook.fn(memo, opts.args)
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
    args._ = args._ || []
    // shift the command itself
    if (args._[0] === commandName) args._.shift()
    this.args = args

    this.stage = ServiceStage.init
    // 初始化环境变量
    loadEnv({ cwd: this.cwd, envFile: '.env' })
    // 获取项目信息
    this.getPkg()
    // 初始化地址
    this.paths = getPaths({
      cwd: this.cwd,
      prefix: this.frameworkName,
      env: this.env,
    })

    log.verbose('paths', JSON.stringify(this.paths))

    // 未修改之前的config
    const userConfig = this.config.getConfig()

    // 获取插件
    const plugins = getPlugins({
      cwd: this.opts.cwd,
      plugins: this.opts?.plugins,
      config: userConfig,
    })

    // 初始化插件并注册插件
    this.stage = ServiceStage.init
    while (plugins.length) {
      await this.initPlugin({ plugin: plugins.shift()!, plugins })
    }

    const command = this.commands[commandName]

    assert(
      command,
      `Invalid command ${chalk.red(commandName)}, it's not registered.`
    )

    // 收集可能更改后config一些属性
    // 这里已经获取了修改之后的完整config
    this.stage = ServiceStage.resolveConfig
    await this.config.getModifyConfig()

    // 开始钩子
    this.stage = ServiceStage.onStart
    await this.applyHooks({
      key: 'onStart',
      type: ApplyHooksType.event,
    })

    this.stage = ServiceStage.runCommand
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

    // 转换指针，并绑定第一个参数，因为插件内部可能会还注册插件，
    // 因此当再次注册插件时会保存进内存（plugins）中，进行while循环，给新注册的插件初始化（initPlugin）
    // 插件注册之后需要收集插件进行其他的操作
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
        'pkg',
        'pkgPath',
        'frameworkName',
      ],
      staticProps: {
        service: this,
        ServiceStage,
      },
    })

    const ret = await param.plugin.apply()(proxyPluginAPI)

    assert(
      !this.keyToPluginMap[param.plugin.key],
      `key ${param.plugin.key} is already registered by ${
        this.keyToPluginMap[param.plugin.key]?.path
      }, plugin from ${param.plugin.path} register failed.`
    )

    this.keyToPluginMap[param.plugin.key] = param.plugin

    if (ret?.plugins) {
      ret.plugins = ret.plugins.map(
        (plugin: string) =>
          new Plugin({
            path: plugin,
            cwd: this.cwd,
          })
      )
    }
    return ret || {}
  }

  // 查看是否启用了插件
  // 因为一些钩子是注册在插件中，因此插件被禁用，那么插件内的一些注册钩子也将失效
  // name 有可能是id（插件id）、hook（hook内注册了plugin，因此可以判断出当前plugin是否启用）
  isPluginEnable(name: any) {
    const userConfig = this.config.userConfig
    const config = this.config.config
    let plugin: Plugin | undefined
    if ((name as Hook).plugin) {
      plugin = (name as Hook).plugin
    } else {
      plugin = this.plugins[name as string]
      if (!plugin) return false
    }
    const { id, key, enable } = plugin
    if (this.skipPluginIds.has(id)) return false
    if (userConfig[key] === false) return false
    if (config[key] === false) return false
    if (enable == false) return false
    if (typeof enable === 'function')
      return enable({
        config: this.config,
      })
    return true
  }

  getPkg() {
    let pkg: Record<string, string | Record<string, any>> = {}
    let pkgPath = ''
    try {
      pkg = require(join(this.cwd, 'package.json'))
      pkgPath = join(this.cwd, 'package.json')
    } catch (_e) {
      // APP_ROOT
      if (this.cwd !== process.cwd()) {
        try {
          pkg = require(join(process.cwd(), 'package.json'))
          pkgPath = join(process.cwd(), 'package.json')
        } catch (_e) {}
      }
    }

    this.pkg = pkg
    this.pkgPath = pkgPath
  }
}
