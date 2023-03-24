import { crossSpawn, log } from '@etfm/shared'
;(async () => {
  const args = process.argv.slice(2)
  const command = `father ${args.join(' ')}`

  log.verbose('father:command', command)

  const cmd = process.cwd()

  log.verbose('father:cmd', cmd)

  const result = crossSpawn.sync(command, {
    stdio: 'inherit',
    cwd: cmd,
    shell: true,
  })
  if (result.status !== 0) {
    log.error('father', `Execute command error (${cmd})`)
    process.exit(1)
  }
})()
