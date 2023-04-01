import { getSchemas } from './schema'

export default (api: any) => {
  const configDefaults: Record<string, any> = {}

  const extraSchemas = getSchemas()
  const schemas = {
    ...extraSchemas,
  }
  for (const key of Object.keys(schemas)) {
    const config: Record<string, any> = {
      schema: schemas[key] || ((Joi: any) => Joi.any()),
    }
    if (key in configDefaults) {
      config.default = configDefaults[key]
    }
    api.registerPlugins([
      {
        id: `virtual: config-${key}`,
        key,
        config,
      },
    ])
  }

  // api.modifyConfig((memo: any, args: any) => {
  //   console.log('etfm-plugin-config:modifyConfig', memo, args)
  //   return memo
  // })
}
