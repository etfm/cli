import { log, glob } from '@etfm/shared'
import { join, resolve } from 'path'
import { readFileSync } from 'fs'
;(() => {
  log.verbose('scripts:build', '=====')

  // 获取packages包下的package.json

  const path = join(__dirname, '../../')
  const getPackages = glob.sync('packages/**/package.json', {
    cwd: path,
  })

  // 读取package.json文件里的name（包名）
  const packageNames = getPackages
    .map((dir) => {
      const dir_path = resolve(path, dir)
      const content = readFileSync(dir_path, 'utf-8')

      return JSON.parse(content).name
    })
    .filter((p) => p.includes('etfm'))

  log.verbose('scripts:packageNames', packageNames.toString())

  //   const {}  = prompts({ type: 'multiselect', choices: [
  //     {
  //         value: ''
  //     }
  //   ] })
})()
