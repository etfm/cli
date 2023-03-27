import { Service } from './service'
import { Plugin } from './plugin'
import { lodash } from '@etfm/shared'

export class Api {
  public service: Service
  public plugin: Plugin

  constructor(param: { service: Service; plugin: Plugin }) {
    this.service = param.service
    this.plugin = param.plugin
  }

  registerPlugins(source: Plugin[], plugins: any[]) {
    // assert(
    //   this.service.stage === ServiceStage.initPresets ||
    //     this.service.stage === ServiceStage.initPlugins,
    //   `api.registerPlugins() failed, it should only be used in registering stage.`
    // )
    const mappedPlugins = plugins.map((plugin) => {
      if (lodash.isPlainObject(plugin)) {
        assert(
          plugin.id && plugin.key,
          `Invalid plugin object, id and key must supplied.`
        )
        plugin.enableBy = plugin.enableBy || 'register'
        plugin.apply = plugin.apply || (() => () => {})
        return plugin
      } else {
        return new Plugin({
          path: plugin,
          cwd: this.service.cwd,
        })
      }
    })

    source.splice(0, 0, ...mappedPlugins)
  }

  static proxyPluginAPI(opts: {
    pluginAPI: Api
    service: Service
    serviceProps: string[]
    staticProps: Record<string, any>
  }) {
    return new Proxy(opts.pluginAPI, {
      get: (target, prop: string) => {
        if (opts.serviceProps.includes(prop)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const serviceProp = opts.service[prop]
          return typeof serviceProp === 'function'
            ? serviceProp.bind(opts.service)
            : serviceProp
        }
        if (prop in opts.staticProps) {
          return opts.staticProps[prop]
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return target[prop]
      },
    })
  }
}
