'use strict'

module.exports = function (bundler) {
  const oe = bundler.emit.bind(bundler)
  console.log('yeeeeee\n')
  bundler.emit = (...a) => {
    console.log('\n%o\n', a)
    return oe(...a)
  }
}
