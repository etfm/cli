import { winPath } from '@etfm/shared'
import { existsSync, statSync } from 'fs'
import { join } from 'path'
import { NodeEnv } from '@etfm/types'

function winJoin(...args: string[]) {
  return winPath(join(...args))
}

export function getPaths(opts: { cwd: string; prefix: string; env: NodeEnv }) {
  const cwd = opts.cwd
  const src = winJoin(cwd, 'src')
  const absSrcPath = existsSync(src) && statSync(src).isDirectory() ? src : cwd
  const absPagesPath = winJoin(absSrcPath, 'pages')
  const absApiRoutesPath = winJoin(absSrcPath, 'api')
  const tmp =
    opts.env === NodeEnv.development
      ? `.${opts.prefix}`
      : `.${opts.prefix}-${opts.env}`
  const absTmpPath = winJoin(absSrcPath, tmp)
  const absNodeModulesPath = winJoin(cwd, 'node_modules')
  const absOutputPath = winJoin(cwd, 'dist')
  return {
    cwd,
    absSrcPath,
    absPagesPath,
    absApiRoutesPath,
    absTmpPath,
    absNodeModulesPath,
    absOutputPath,
  }
}

export type Paths = ReturnType<typeof getPaths>
