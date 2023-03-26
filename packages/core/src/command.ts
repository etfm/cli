import { yParser } from '@etfm/shared'

interface IOpts {
  fn: {
    ({ args }: { args: yParser.Arguments }): void
  }
}

export class Command {
  public fn: {
    ({ args }: { args: yParser.Arguments }): void
  }

  constructor(opts: IOpts) {
    this.fn = opts.fn
  }
}
