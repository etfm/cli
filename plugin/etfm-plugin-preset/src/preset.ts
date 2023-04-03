import { IApi } from 'etfm'

export default (api: IApi) => {
  return {
    plugins: [
      require.resolve('@etfm/etfm-plugin-version'),
      require.resolve('@etfm/etfm-plugin-help'),
    ],
  }
}
