import { log, inquirer, execa } from '@etfm/shared'
import { getPackages } from './utils'
import { DEFAULT_OPTIONS } from './const'
;(async () => {
  const packageNames = getPackages()
  const { project } = await inquirer.prompt({
    name: 'project',
    type: 'checkbox',
    message: '请选择要运行的模块(Please select the module to build):',
    choices: [...packageNames, ...DEFAULT_OPTIONS],
  })

  if (project.includes('all')) {
    execaShell(packageNames.map((item: { value: any }) => item.value))
  } else {
    execaShell(project)
  }
})()

function execaShell(args: string[]) {
  args.forEach((name: string) => {
    execa
      .execaCommand(`lerna exec --scope ${name} pnpm dev`, {
        stdio: 'inherit',
      })
      .catch((e: any) => {
        log.verbose(name, e.toString())
        log.error(name, `${name}运行失败`)
      })
  })
}
