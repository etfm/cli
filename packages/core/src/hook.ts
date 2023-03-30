import assert from 'assert'
import { Plugin } from './plugin'
export interface IHookOpts {
  key: string
  fn: Function
  before?: string
  stage?: number
  plugin: Plugin
}

export class Hook {
  public key: string
  public fn: Function
  public before?: string
  public stage?: number
  public plugin: Plugin

  constructor(opts: IHookOpts) {
    assert(
      opts.key && opts.fn,
      `Invalid hook ${opts}, key and fn must supplied.`
    )

    this.key = opts.key
    this.fn = opts.fn
    this.before = opts.before
    this.stage = opts.stage || 0
    this.plugin = opts.plugin
  }
}
