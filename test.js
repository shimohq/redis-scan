// It's not a regular test file

const Scan = require('./')

const scan = new Scan()

scan.start().then(() => process.exit())
