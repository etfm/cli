import { joi, esbuild, lodash, register, semver, zod } from '@etfm/shared'
import assert from 'assert'
import { existsSync } from 'fs'
import { join } from 'path'
import { DEFAULT_CONFIG_FILES, LOCAL_EXT, SHORT_ENV } from './constants'
import { addExt } from './utils'
import { NodeEnv } from '@etfm/types'
import { ApplyHooksType, Service } from './service'

interface IConfigOpts {
  cwd: string
  env: NodeEnv
  defaultConfigFiles?: string[]
  service: Service
}

export class Config {
  public opts: IConfigOpts
  public mainConfigFilePath: string | null
  public filePaths: string[] = []
  public config: Record<string, any> = {}
  public service: Service
  public configSchema: Record<string, any> = {}
  public defaultConfig: Record<string, any> = {}
  constructor(opts: IConfigOpts) {
    this.opts = opts
    this.service = opts.service
    // 获取主要配置文件路径
    this.mainConfigFilePath = this.getMainConfigFilePath()
    // 获取所有配置文件路径
    this.filePaths = this.getConfigFilePaths()
  }

  getValidateConfig(opts: { schemas: any }) {
    const config = this.getConfig()
    this.validateConfig({ config, schemas: opts.schemas })
    this.config = config
    return config
  }

  // 获取主要的配置文件路径，并进行验证
  // 配置文件有且只有一个
  private getMainConfigFilePath() {
    let mainConfigFilePath = null
    for (const configFile of this.opts.defaultConfigFiles ||
      DEFAULT_CONFIG_FILES) {
      const absConfigFile = join(this.opts.cwd, configFile)
      if (existsSync(absConfigFile)) {
        mainConfigFilePath = absConfigFile
        break
      }
    }
    return mainConfigFilePath
  }

  // 获取所有配置文件路径
  private getConfigFilePaths() {
    const paths: string[] = []
    const { mainConfigFilePath, opts } = this

    if (mainConfigFilePath) {
      const env = SHORT_ENV[opts.env] || opts.env
      paths.push(
        ...[
          mainConfigFilePath,
          addExt({ file: mainConfigFilePath, ext: `.${env}` }),
        ].filter(Boolean)
      )

      // 环境变量配置
      if (opts.env === NodeEnv.development) {
        paths.push(addExt({ file: mainConfigFilePath, ext: LOCAL_EXT }))
      }
    }
    return paths
  }

  getConfig() {
    let config = {}
    for (const configFile of this.filePaths) {
      if (existsSync(configFile)) {
        register.register({
          implementor: esbuild,
        })
        register.clearFiles()
        try {
          config = lodash.merge(config, require(configFile).default)
        } catch (e) {
          // Error.prototype.cause has been fully supported from  node v16.9.0
          // Ref https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause#browser_compatibility
          if (semver.lt(semver.clean(process.version)!, '16.9.0')) {
            throw e
          }

          throw new Error(`Parse config file failed: [${configFile}]`, {
            cause: e,
          })
        }
        for (const file of register.getFiles()) {
          delete require.cache[file]
        }
        register.restore()
      }
    }

    return config
  }

  validateConfig(opts: { config: any; schemas: any }) {
    const errors = new Map<string, Error>()
    const configKeys = new Set(Object.keys(opts.config))

    console.log(configKeys, '====--------------00000', opts.schemas)
    for (const key of Object.keys(opts.schemas)) {
      configKeys.delete(key)
      if (!opts.config[key]) continue
      const schema = opts.schemas[key]({ ...joi, zod })

      if (joi.isSchema(schema)) {
        const { error } = schema.validate(opts.config[key])
        if (error) errors.set(key, error)
      } else {
        // invalid schema
        assert(
          'safeParse' in schema,
          `schema for config ${key} is not valid, neither joi nor zod.`
        )
        const { error } = schema.safeParse(opts.config[key])
        if (error) errors.set(key, error)
      }
    }
    // invalid config values
    assert(
      errors.size === 0,
      `Invalid config values: ${Array.from(errors.keys()).join(', ')}
${Array.from(errors.keys()).map((key) => {
  return `Invalid value for ${key}:\n${errors.get(key)!.message}`
})}`
    )
    // invalid config keys
    assert(
      configKeys.size === 0,
      `Invalid config keys: ${Array.from(configKeys).join(', ')}`
    )
  }

  // 这个步骤插件已经初始化完成
  async setAttrConfig() {
    for (const plugin of Object.values(this.service.plugins)) {
      const { config: pluginConfig, key } = plugin
      if (pluginConfig.schema) this.configSchema[key] = pluginConfig.schema
      if (pluginConfig.default !== undefined)
        this.defaultConfig[key] = pluginConfig.default

      const validateConfig = this.getValidateConfig({
        schemas: this.configSchema,
      })

      const config = await this.service.applyHooks({
        key: 'modifyConfig',
        type: ApplyHooksType.modify,
        initialValue: lodash.cloneDeep(validateConfig),
        args: { paths: this.service.paths },
      })
      const defaultConfig = await this.service.applyHooks({
        key: 'modifyDefaultConfig',
        type: ApplyHooksType.modify,
        initialValue: lodash.cloneDeep(this.defaultConfig),
      })
      this.config = lodash.merge(defaultConfig, config) as unknown as Record<
        string,
        any
      >

      return { config, defaultConfig }
    }
  }
}
