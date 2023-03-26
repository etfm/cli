import { winPath, pkgUp, log } from '@etfm/shared'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
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

    this.key = this.getKey()
    this.apply = () => {}
  }

  private getId(param: { pkg: any; isPkgEntry: boolean; pkgPath: string }) {
    let id
    if (param.isPkgEntry) {
      id = param.pkg.name
    } else {
      id = winPath(this.path)
    }

    console.log('plugin:getId', id)

    id = id.replace(/\.js$/, '')

    return id
  }

  private getKey() {
    return ''
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
