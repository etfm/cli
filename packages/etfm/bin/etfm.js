#! /usr/bin/env node

require('../dist/cli')
  .run()
  .then(() => {
    process.exit(1)
  })
