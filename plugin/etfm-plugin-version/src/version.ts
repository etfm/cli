import { IApi } from 'etfm'

export default (api: IApi) => {
  api.registerCommand({
    name: 'version',
    alias: 'v',
    fn: () => {
      const version = require('../package.json').version
      console.log(`${api.frameworkName}@${version}`)
      return version
    },
  })
}
