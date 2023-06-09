import log from '../compiled/npmlog'
import { isDebug } from './isDebug'

if (isDebug()) {
  log.level = 'verbose'
} else {
  log.level = 'info'
}

log.heading = 'etfm'
log.addLevel('success', 2000, { fg: 'green', bold: true })

export { log }
