import yParser from 'yargs-parser'
import crossSpawn from 'cross-spawn'
import * as execa from 'execa'
import lodash from 'lodash-es'
import npmlog from 'npmlog'
import chalk from 'chalk'
import glob from 'glob'
import inquirer from 'inquirer'

import { isDev } from './isDev'
import { log } from './log'

export {
  yParser,
  crossSpawn,
  execa,
  lodash,
  npmlog,
  isDev,
  log,
  chalk,
  inquirer,
  glob,
}
