import { yParser, log, isDebug } from '@etfm/shared'
import { Service } from './service'
import { DEV_COMMAND, FRAMEWORK_NAME, MIN_NODE_VERSION } from './constants'

export async function run() {
  // 检查node版本
  checkVersion(MIN_NODE_VERSION)

  //接受参数
  const args = yParser(process.argv.slice(2), {
    alias: {
      version: ['v'],
      help: ['h'],
    },
  })

  // env 初始化设置
  process.env.FRAMEWORK_NAME = FRAMEWORK_NAME

  if (isDebug()) {
    process.env.DEBUG = 'debug'
  } else {
    process.env.DEBUG = ''
  }

  const commandName = args._[0]
  if (commandName === DEV_COMMAND) {
    process.env.NODE_ENV = 'development'
  } else if (commandName === 'build') {
    process.env.NODE_ENV = 'production'
  }

  try {
    await new Service().start({
      commandName,
      args,
    })
  } catch (e: any) {
    log.verbose('etfm:run', e.toString())
    process.exit(1)
  }
}

function checkVersion(version: number) {
  const v = parseInt(process.version.slice(1))
  if (v < version) {
    log.error(
      'version',
      `Your node version ${v} is not supported, please upgrade to ${version} .`
    )
    process.exit(1)
  }
}
