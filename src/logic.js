'use strict'

const fs = require('fs')
const path = require('path')
const {downloadFile, findMatches, findFileMatches, regex, regexFiles} = require('./util')

async function downloadMatch (match, cachePath, globalAssetsStore, justFetch) {
  let data
  let p = path.join(cachePath, match.filename)

  if (globalAssetsStore[match.filename] || fs.existsSync(p)) {
    if (!justFetch) {
      data = fs.readFileSync(p)
    }
  } else {
    data = await downloadFile(match.url)

    fs.writeFileSync(p, data)
  }

  globalAssetsStore[match.filename] = p

  return {data, path: p}
}

function postProcess (origPath, cachePath, globalAssetsStore, doProcess) {
  const outPath = path.join(cachePath, 'processed-' + path.basename(origPath))

  if (!globalAssetsStore[outPath]) {
    const contents = fs.readFileSync(origPath)

    const out = doProcess(contents)

    fs.writeFileSync(outPath, out)
  }

  return {path: outPath}
}

async function googleFontsTree (html, assetDir, cachePath, globalAssetsStore) {
  const matches = findMatches(html)

  let replace = {}

  let _uniq = {}
  let cssFiles = []
  let assets = []

  let i

  let fileMatches = []

  for (i = 0; i < matches.length; i++) {
    const match = matches[i]

    const {data, path} = await downloadMatch(match, cachePath, globalAssetsStore) // download css

    match.path = path
    cssFiles.push(match)

    const asset = {
      type: 'css',
      path,
      subassets: []
    }
    assets.push(asset)

    const _fileMatches = findFileMatches(String(data))

    _fileMatches.forEach(el => {
      asset.subassets.push(match)

      if (!_uniq[el.filename]) {
        fileMatches.push(el)

        _uniq[el.filename] = true
      }
    })
  }

  for (i = 0; i < fileMatches.length; i++) {
    let match = fileMatches[i]
    const {path: p} = await downloadMatch(match, cachePath, globalAssetsStore, true) // download fonts

    replace[match.match] = './' + path.relative(assetDir, p)
  }

  await Promise.all(cssFiles.map(async (match) => {
    const {path: p} = await postProcess(match.path, cachePath, globalAssetsStore, (contents) => {
      return Buffer.from(String(contents).replace(regexFiles, (match) => replace[match]))
    })

    match.path = p
    replace[match.match] = './' + path.relative(assetDir, p)
  }))

  assets.forEach(asset => {
    const {subassets} = asset
    asset.subassets = subassets.map((subasset) => {
      return {
        type: path.parse(subasset.path).ext.substr(1),
        path: subasset.path
      }
    })
  })

  return {
    processedHtml: html.replace(regex, (match) => replace[match]),
    assets
  }
}

module.exports = googleFontsTree
