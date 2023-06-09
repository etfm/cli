import { IApi } from 'etfm'
import { log, chalk, lodash } from '@etfm/shared'

export default (api: IApi) => {
  api.registerCommand({
    name: 'help',
    description: 'show commands help',
    details: `
etfm help build
etfm help dev
`,
    fn() {
      const subCommand = api.args._[0]
      if (subCommand) {
        if (subCommand in api.service.commands) {
          showHelp(api.service.commands[subCommand])
        } else {
          log.error('help', `Invalid sub command ${subCommand}.`)
        }
      } else {
        showHelps(api.service.commands)
      }
    },
  })

  function showHelp(command: any) {
    console.log(`
Usage: etfm ${command.name} [options]
${command.description ? `${chalk.gray(command.description)}.\n` : ''}
${command.options ? `Options:\n${padLeft(command.options)}\n` : ''}
${command.details ? `Details:\n${padLeft(command.details)}` : ''}
`)
  }

  function showHelps(commands: typeof api.service.commands) {
    console.log(`
Usage: etfm <command> [options]

Commands:

${getDeps(commands)}
`)
    console.log(
      `Run \`${chalk.bold(
        'etfm help <command>'
      )}\` for more information of specific commands.`
    )
    console.log(
      `Visit ${chalk.bold('https://umijs.org/')} to learn more about Umi.`
    )
    console.log()
  }

  function getDeps(commands: any) {
    return Object.keys(commands)
      .map((key) => {
        return `    ${chalk.green(lodash.padEnd(key, 10))}${
          commands[key].description || ''
        }`
      })
      .join('\n')
  }

  function padLeft(str: string) {
    return str
      .trim()
      .split('\n')
      .map((line: string) => `    ${line}`)
      .join('\n')
  }
}
