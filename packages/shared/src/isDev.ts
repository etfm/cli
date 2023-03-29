export function isDev() {
  const args = process.argv.slice(2)
  return args.includes('dev')
}
