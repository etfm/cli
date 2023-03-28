import assert from 'assert'

export interface IHookOpts {
  key: string
  fn: Function
  before?: string
  stage?: number
}

export class Hook {
  public key: string
  public fn: Function
  public before?: string
  public stage?: number

  constructor(opts: IHookOpts) {
    assert(
      opts.key && opts.fn,
      `Invalid hook ${opts}, key and fn must supplied.`
    )

    this.key = opts.key
    this.fn = opts.fn
    this.before = opts.before
    this.stage = opts.stage || 0
  }
}
