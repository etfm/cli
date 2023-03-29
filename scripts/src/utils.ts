import { join, resolve } from 'path'
import { glob } from '@etfm/shared'
import { readFileSync } from 'fs'

// 获取模块
function getPackages() {
  const path = join(__dirname, '../../')
  const getPackages = glob
    .sync('**/**/package.json', {
      cwd: path,
    })
    .filter((path: string) => !path.includes('node_modules'))

  const packageNames = getPackages
    .map((dir: string) => {
      const content = readFileSync(resolve(path, dir), 'utf-8')
      const parseContent = JSON.parse(content)
      return {
        value: parseContent.name,
        title: parseContent.name,
      }
    })
    .filter(
      (p: { title: string; value: string }) =>
        p.value.includes('etfm') && !p.value.includes('etfm-scripts')
    )

  return packageNames
}

export { getPackages }
