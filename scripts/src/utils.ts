import { join, resolve } from 'path'
import { glob } from '@etfm/shared'
import { readFileSync } from 'fs'

// 获取模块
function getPackages() {
  const path = join(__dirname, '../../')
  const getPackages = glob.sync('packages/**/package.json', {
    cwd: path,
  })

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

  return packageNames
}

export { getPackages }
