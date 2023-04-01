import yParser from '../compiled/yargs-parser'
import crossSpawn from '../compiled/cross-spawn'
import * as execa from '../compiled/execa'
import lodash from '../compiled/lodash'
import npmlog from '../compiled/npmlog'
import chalk from '../compiled/chalk'
import glob from '../compiled/glob'
import inquirer from '../compiled/inquirer'
import * as pkgUp from '../compiled/pkg-up'
import pirates from '../compiled/pirates'
import esbuild from '../compiled/esbuild'
import * as tapable from '../compiled/tapable'
import joi from '../compiled/joi'
import zod, { z } from '../compiled/zod'
import semver from '../compiled/semver'
import * as dotenv from '../compiled/dotenv'
import * as dotenvExpand from '../compiled/dotenv-expand'

import { isDebug } from './isDebug'
import { log } from './log'
import { winPath } from './winPath'
import * as register from './register'

export {
  yParser,
  crossSpawn,
  execa,
  lodash,
  npmlog,
  isDebug,
  log,
  chalk,
  inquirer,
  glob,
  pkgUp,
  winPath,
  pirates,
  esbuild,
  register,
  tapable,
  joi,
  z,
  zod,
  semver,
  dotenv,
  dotenvExpand,
}
