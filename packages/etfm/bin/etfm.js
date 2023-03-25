#! /usr/bin/env node

require('../dist/cli')
  .run()
  .then((e) => {
    console.error(e)
    process.exit(1)
  })
