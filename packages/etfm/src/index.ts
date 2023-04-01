import { IServicePluginAPI, IPluginApi } from '@etfm/core'

export * from './service'
export { run } from './cli'
export type IApi = IPluginApi & IServicePluginAPI
