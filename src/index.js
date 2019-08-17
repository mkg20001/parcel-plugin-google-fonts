'use strict'

module.exports = function (bundler) {
  bundler.addAssetMiddleware('html', require.resolve('./HtmlMiddleware'))
}
