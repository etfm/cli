import { log, glob, inquirer } from '@etfm/shared'
import { join, resolve } from 'path'
import { readFileSync } from 'fs'

const DEFAULT_OPTIONS = [
  {
    value: 'all',
    title: 'all',
  },
]
;(async () => {
  // 获取packages包下的package.json
  const path = join(__dirname, '../../')
  const getPackages = glob.sync('packages/**/package.json', {
    cwd: path,
  })

  // 读取package.json文件里的name（包名）
  const packageNames = getPackages
    .map((dir) => {
      const content = readFileSync(resolve(path, dir), 'utf-8')
      const parseContent = JSON.parse(content)
      return {
        value: parseContent.name,
        title: parseContent.name,
      }
    })
    .filter((p) => p.value.includes('etfm'))

  log.verbose('scripts:packageNames', packageNames.toString())

  const projects = await inquirer.prompt({
    name: 'project',
    type: 'checkbox',
    message: '请选择要构建的模块(Please select the module to build):',
    choices: [...packageNames, ...DEFAULT_OPTIONS],
  })

  console.log('scripts:prompts', projects)
})()
