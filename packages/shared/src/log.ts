import log from '../compiled/npmlog'
import { isDev } from './isDev'

if (isDev()) {
  log.level = 'verbose'
} else {
  log.level = 'info'
}

log.heading = 'etfm'
log.addLevel('success', 2000, { fg: 'green', bold: true })

export { log }
