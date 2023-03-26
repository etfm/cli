import { winPath, pkgUp, log, lodash, register, esbuild } from '@etfm/shared'
import { existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import assert from 'assert'

export class Plugin {
  public id: string
  public key: string
  public path: string
  public apply: Function
  public enableBy: any
  public cwd: string

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

    this.id = this.getId({ pkg, isPkgEntry, pkgPath })
    log.verbose('plugin:constructor:id', this.id)

    this.key = this.getKey({ pkg, isPkgEntry })

    console.log('plugin:constructor:key', this.key)

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

  private getId(param: { pkg: any; isPkgEntry: boolean; pkgPath: string }) {
    let id
    if (param.isPkgEntry) {
      id = param.pkg.name
    } else {
      id = winPath(this.path)
    }
    id = id.replace(/\.js$/, '')
    return id
  }

  private getKey(param: { pkg: any; isPkgEntry: boolean }) {
    const name = param.isPkgEntry
      ? this.stripNoneScope(param.pkg.name).replace(
          /^(@etfm\/|etfm-)plugin-/,
          ''
        )
      : basename(this.path, extname(this.path))

    return this.nameToKey(name)
  }

  private nameToKey(name: string) {
    return name
      .split('.')
      .map((part) => lodash.camelCase(part))
      .join('.')
  }

  private stripNoneScope(name: string) {
    if (name.charAt(0) === '@' && !name.startsWith('@etfm/')) {
      name = name.split('/')[1]
    }

    return name
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
