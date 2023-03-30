import { joi, esbuild, lodash, register, semver, zod } from '@etfm/shared'
import assert from 'assert'
import { existsSync } from 'fs'
import { join } from 'path'
import { DEFAULT_CONFIG_FILES, LOCAL_EXT, SHORT_ENV } from './constants'
import { addExt, getAbsFiles } from './utils'

export enum Env {
  development = 'development',
  production = 'production',
  test = 'test',
}
interface IOpts {
  cwd: string
  env: Env
  specifiedEnv?: string
  defaultConfigFiles?: string[]
}

type ISchema = Record<string, any>

export class Config {
  public opts: IOpts
  public mainConfigFile: string | null
  public prevConfig: any
  public files: string[] = []
  constructor(opts: IOpts) {
    this.opts = opts
    this.mainConfigFile = this.getMainConfigFile()
    this.prevConfig = null
  }

  getConfig(opts: { schemas: ISchema }) {
    const { config, files } = this.getUserConfig()
    this.validateConfig({ config, schemas: opts.schemas })
    this.files = files
    return (this.prevConfig = {
      config: config,
      files,
    })
  }

  getMainConfigFile() {
    let mainConfigFile = null
    for (const configFile of this.opts.defaultConfigFiles ||
      DEFAULT_CONFIG_FILES) {
      const absConfigFile = join(this.opts.cwd, configFile)
      if (existsSync(absConfigFile)) {
        mainConfigFile = absConfigFile
        break
      }
    }
    return mainConfigFile
  }

  getConfigFiles(opts: {
    mainConfigFile: string | null
    env: Env
    specifiedEnv?: string
  }) {
    const ret: string[] = []
    const { mainConfigFile } = opts
    const specifiedEnv = opts.specifiedEnv || ''
    if (mainConfigFile) {
      const env = SHORT_ENV[opts.env] || opts.env
      ret.push(
        ...[
          mainConfigFile,
          specifiedEnv &&
            addExt({ file: mainConfigFile, ext: `.${specifiedEnv}` }),
          addExt({ file: mainConfigFile, ext: `.${env}` }),
          specifiedEnv &&
            addExt({
              file: mainConfigFile,
              ext: `.${env}.${specifiedEnv}`,
            }),
        ].filter(Boolean)
      )

      if (opts.env === Env.development) {
        ret.push(addExt({ file: mainConfigFile, ext: LOCAL_EXT }))
      }
    }
    return ret
  }

  getUserConfig() {
    const c_files = this.getConfigFiles({
      mainConfigFile: this.mainConfigFile,
      env: this.opts.env,
      specifiedEnv: this.opts.specifiedEnv,
    })

    const configFiles = getAbsFiles({
      files: c_files,
      cwd: this.opts.cwd,
    })

    let config = {}
    const files: string[] = []

    for (const configFile of configFiles) {
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
        // includes the config File
        files.push(...register.getFiles())
        register.restore()
      } else {
        files.push(configFile)
      }
    }

    return {
      config,
      files,
    }
  }

  validateConfig(opts: { config: any; schemas: ISchema }) {
    const errors = new Map<string, Error>()
    const configKeys = new Set(Object.keys(opts.config))
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
}
