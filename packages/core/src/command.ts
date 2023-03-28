import { yParser } from '@etfm/shared'

export interface ICommandOpts {
  name: string
  description: string
  details: string
  fn: {
    ({ args }: { args: yParser.Arguments }): void
  }
}

export class Command {
  public name: string
  public description: string
  public details: string
  public fn: {
    ({ args }: { args: yParser.Arguments }): void
  }

  constructor(opts: ICommandOpts) {
    this.name = opts.name
    this.description = opts.description
    this.details = opts.details
    this.fn = opts.fn
  }
}
