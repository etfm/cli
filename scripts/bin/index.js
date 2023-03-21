#!/usr/bin/env node

const { join } = require('path')
const { crossSpawn } = require('@etfm/shared')

const argv = process.argv.slice(2)
const [name, ...throughArgs] = argv

const scriptsPath = join(__dirname, `../${name}.ts`)

console.log(crossSpawn, '----')

// const scriptPathAsStr = JSON.stringify(scriptsPath)
// const spawn = sync(
//   'tsx',
//   [scriptPathAsStr, ...throughArgs],
//   {
//     env: process.env,
//     cwd: process.cwd(),
//     stdio: 'inherit',
//     shell: true
//   }
// )
// if (spawn.status !== 0) {
//   console.log(chalk.red(`umi-scripts: ${name} execute fail`))
//   process.exit(1)
// }
