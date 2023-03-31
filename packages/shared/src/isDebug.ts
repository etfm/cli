export function isDebug() {
  const args = process.argv.slice(2)
  return args.includes('-d') || args.includes('--debug') || process.env.DEBUG
}
