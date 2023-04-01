import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { dotenv, dotenvExpand } from '@etfm/shared'

export function loadEnv(opts: { cwd: string; envFile: string }) {
  const files = [
    join(opts.cwd, opts.envFile),
    join(opts.cwd, `${opts.envFile}.local`),
  ]
  for (const file of files) {
    if (!existsSync(file)) continue
    const parsed: Record<string, string> =
      dotenv.parse(readFileSync(file)) || {}
    dotenvExpand.expand({ parsed, ignoreProcessEnv: true })
    for (const key of Object.keys(parsed)) {
      process.env[key] = parsed[key]
    }
  }
}
