import {
  winPath,
  pkgUp,
  log,
  lodash,
  register,
  esbuild,
  joi,
  z,
  zod,
} from '@etfm/shared'
import { existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import assert from 'assert'

export interface IPluginConfig {
  default?: any
  schema?: {
    (joi: joi.Root & { zod: typeof z }): joi.Schema | zod.Schema
  }
  onChange?: string | Function
}

export enum EnableBy {
  register = 'register',
  config = 'config',
}

export class Plugin {
  public key: string
  public path: string
  public apply: Function
  enableBy: EnableBy | ((opts: { config: any }) => boolean) = EnableBy.register
  public cwd: string
  public config: IPluginConfig = {}

  constructor(opts: { path: string; cwd: string }) {
    this.cwd = opts.cwd
    this.path = winPath(opts.path)

    assert(existsSync(this.path), `Invalid ${this.path}, it's not exists.`)

    let pkg = null
    let isPkgEntry = false
    const pkgPath = pkgUp.pkgUpSync({
      cwd: this.path,
    })
    if (pkgPath) {
      pkg = require(pkgPath)
      isPkgEntry =
        winPath(join(dirname(pkgPath), pkg.main || 'index.js')) ===
        winPath(this.path)
    }

    // key的两种形式：
    // 1.package.json的name
    // 2.插件的文件名
    //   e.g.
    //     initial-state -> initialState
    //     webpack.css-loader -> webpack.cssLoader
    this.key = this.getKey({ pkg, isPkgEntry })

    log.verbose('plugin:constructor:key', this.key)

    this.apply = () => {
      register.register({
        implementor: esbuild,
        exts: ['.ts', '.mjs'],
      })
      register.clearFiles()
      let ret
      try {
        ret = require(this.path)
      } catch (e: any) {
        throw new Error(`Register ${this.path} failed, since ${e.message}`, {
          cause: e,
        })
      } finally {
        register.restore()
      }

      // use the default member for es modules
      return ret.__esModule ? ret.default : ret
    }
  }

  merge(opts: { key?: string; config?: IPluginConfig; enableBy?: any }) {
    if (opts.key) this.key = opts.key
    if (opts.config) this.config = opts.config
    if (opts.enableBy) this.enableBy = opts.enableBy
  }

  private getKey(param: { pkg: any; isPkgEntry: boolean }) {
    const name = basename(this.path, extname(this.path))
    return param.isPkgEntry ? param.pkg.name : this.nameToKey(name)
  }

  private nameToKey(name: string) {
    return name
      .split('.')
      .map((part) => lodash.camelCase(part))
      .join('.')
  }

  static getPlugins(param: { cwd: string; plugins?: string[] }) {
    // 获取插件路径
    const plugins = param.plugins ?? []
    return plugins.map((path) => {
      return new Plugin({
        path,
        cwd: param.cwd,
      })
    })
  }
}
