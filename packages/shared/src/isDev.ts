export function isDev() {
  const argvs = process.argv.slice(2)
  return argvs.includes('--dev.ts') || argvs.includes('-d')
}
