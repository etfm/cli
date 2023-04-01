import { winPath, pkgUp, log, lodash, register, esbuild } from '@etfm/shared'
import { existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import assert from 'assert'
import { EnableType, IPlugin, IPluginConfig } from './types'

export class Plugin implements IPlugin {
  public id: string
  public key: string
  public path: string
  public apply: Function
  enable: boolean | ((opts: { config: any }) => boolean)
  public cwd: string
  public config: IPluginConfig = {}

  constructor(opts: { path: string; cwd: string }) {
    this.cwd = opts.cwd
    this.path = winPath(opts.path)
    this.enable = true

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

    this.id = this.getId({ pkg, isPkgEntry })
    log.verbose('plugin:constructor:id', this.id)
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

  merge(opts: { key?: string; config?: IPluginConfig; enable?: EnableType }) {
    if (opts.key) this.key = opts.key
    if (opts.config) this.config = opts.config
    if (opts.enable) this.enable = opts.enable
  }

  private getId(opts: { pkg: any; isPkgEntry: boolean }) {
    let id
    if (opts.isPkgEntry) {
      id = opts.pkg.name
    } else {
      id = winPath(this.path)
    }
    id = id.replace(/\.js$/, '')
    return id
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
}

export function getPlugins(param: {
  cwd: string
  plugins?: string[]
  config: Record<string, any>
}) {
  // 获取插件路径
  const plugins = [...(param.plugins || []), ...(param.config['plugins'] || [])]
  return plugins.map((path) => {
    return new Plugin({
      path,
      cwd: param.cwd,
    })
  })
}
