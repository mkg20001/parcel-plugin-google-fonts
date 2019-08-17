'use strict'

const { Middleware } = require('parcel-bundler')
const logic = require('./logic')
const mkdirp = require('mkdirp').sync
const path = require('path')

class HtmlMiddleware extends Middleware {
  constructor (asset) {
    super(asset)
    this.globalAssetsStore = {}
    this.cachePath = asset.options.cacheDir
    this.assetDir = path.dirname(asset.name)
    mkdirp(this.cachePath)
  }

  async preTransform () {
    const {assets, processedHtml} = await logic(this.asset.contents, this.assetDir, this.cachePath, this.globalAssetsStore)
    this.asset.contents = processedHtml
  }
}

module.exports = HtmlMiddleware
