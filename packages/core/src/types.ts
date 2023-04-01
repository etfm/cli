import { Api } from './api'
import { Config } from './config'
import { Hook } from './hook'
import { joi, z, zod } from '@etfm/shared'
import { ApplyHooksType, Service } from './service'

export interface IServicePluginAPI {
  applyHooks: typeof Service.prototype.applyHooks
  args: typeof Service.prototype.args
  config: typeof Service.prototype.config
  cwd: typeof Service.prototype.cwd
  paths: Required<typeof Service.prototype.paths>
  env: typeof Service.prototype.env
  pkg: typeof Service.prototype.pkg
  pkgPath: typeof Service.prototype.pkgPath
  frameworkName: typeof Service.prototype.frameworkName
  isPluginEnable: typeof Service.prototype.isPluginEnable
  ApplyHooksType: typeof ApplyHooksType
  ServiceStage: typeof ServiceStage
}

export interface IPluginApi {
  describe: typeof Api.prototype.describe
  registerPlugins: (plugins: (IPlugin | string)[]) => void
  registerCommand: typeof Api.prototype.registerCommand
  registerHook: typeof Api.prototype.registerHook
  skipPlugins: typeof Api.prototype.skipPlugins
}

export interface IConfig {
  userConfig: typeof Config.prototype.userConfig
  config: typeof Config.prototype.config
  defaultConfig: typeof Config.prototype.defaultConfig
  configSchema: typeof Config.prototype.configSchema
  filePaths: typeof Config.prototype.filePaths
  getConfig: typeof Config.prototype.getConfig
  validateConfig: typeof Config.prototype.validateConfig
  getModifyConfig: typeof Config.prototype.getModifyConfig
}

export interface IHook {
  key: typeof Hook.prototype.key
  before?: typeof Hook.prototype.before
  stage?: typeof Hook.prototype.stage
  fn: typeof Hook.prototype.fn
}

export interface IPlugin {
  id: string
  key: string
  path: string
  apply: Function
  enable: EnableType
  config: IPluginConfig
  merge: (opts: {
    key?: string
    config?: IPluginConfig
    enable?: EnableType
  }) => void
}

export enum ServiceStage {
  uninitialized,
  init,
  initPlugins,
  resolveConfig,
  onStart,
  runCommand,
}

export type EnableType = boolean | ((opts: { config: any }) => boolean)

export type ISchema = {
  (joi: joi.Root & { zod: typeof z }): joi.Schema | zod.Schema
}

export interface IPluginConfig {
  default?: any
  schema?: ISchema
  onChange?: string | Function
}
