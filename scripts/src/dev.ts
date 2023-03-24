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
    execaShell(packageNames.map((item) => item.value))
  } else {
    execaShell(project)
  }
})()

function execaShell(args: string[]) {
  args.forEach((name: string) => {
    execa
      .execaCommand(`lerna run --scope ${name} dev`, {
        stdio: 'inherit',
        shell: true,
      })
      .catch((e) => {
        log.verbose(name, e.toString())
        log.error(name, `${name}运行失败`)
      })
  })
}
