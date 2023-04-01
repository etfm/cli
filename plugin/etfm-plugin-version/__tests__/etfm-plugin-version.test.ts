import { test, describe, expect } from 'vitest'
import { Service } from 'etfm'

describe('version command', async () => {
  test('version', async () => {
    const v = await new Service({
      plugins: [require.resolve('../dist/version')],
      env: 'development',
    }).start({
      commandName: 'version',
      args: { _: [], $0: '' },
    })

    const version = require('../package.json').version

    expect(v).toEqual(version)
  })
})
