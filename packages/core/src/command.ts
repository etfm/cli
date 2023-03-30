import { yParser } from '@etfm/shared'
import { Plugin } from './plugin'

export interface ICommandOpts {
  name: string
  description: string
  details: string
  fn: {
    ({ args }: { args: yParser.Arguments }): void
  }
  plugin: Plugin
}

export class Command {
  public name: string
  public description: string
  public details: string
  public fn: {
    ({ args }: { args: yParser.Arguments }): void
  }
  public plugin: Plugin

  constructor(opts: ICommandOpts) {
    this.name = opts.name
    this.description = opts.description
    this.details = opts.details
    this.fn = opts.fn
    this.plugin = opts.plugin
  }
}
