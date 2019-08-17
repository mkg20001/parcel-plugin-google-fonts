'use strict'

const fs = require('fs')
const path = require('path')
const {downloadFile, findMatches, findFileMatches, regex, regexFiles} = require('./util')

async function downloadMatch (match, cachePath, globalAssetsStore, justFetch) {
  let data
  let p = path.join(cachePath, match.filename)

  if (globalAssetsStore[match.filename]) {
    if (!justFetch) {
      data = fs.readFileSync(path)
    }
  } else {
    data = await downloadFile(match.url)

    fs.writeFileSync(path, data)

    globalAssetsStore[match.filename] = path
  }

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

async function googleFontsTree (html, cachePath, globalAssetsStore) {
  const matches = findMatches(html)

  let replace = {}

  let _uniq = {}
  let cssFiles = []
  let assets = []

  const fileMatches = (await Promise.all(matches.map(async (match) => {
    const {data, path} = await downloadMatch(match, cachePath, globalAssetsStore) // download css

    match.path = path
    cssFiles.push(match)

    const asset = {
      type: 'css',
      path,
      subassets: []
    }
    assets.push(asset)

    const matches = findFileMatches(String(data))

    matches.forEach(match => {
      asset.subassets.push(match)
    })

    return matches // find fonts in css
  }))).reduce((a, b) => a.concat(b)).filter((el) => { // sort out non-unique
    if (_uniq[el.filename]) { return false }

    _uniq[el.filename] = true
    return true
  })

  await Promise.all(fileMatches.map(async (match) => {
    const {path} = await downloadMatch(match, cachePath, globalAssetsStore, true) // download fonts

    replace[match.match] = path
  }))

  await Promise.all(cssFiles.map(async (match) => {
    const {path} = await postProcess(match.path, cachePath, globalAssetsStore, (contents) => {
      return Buffer.from(String(contents).replace(regexFiles, (match) => replace[match]))
    })

    match.path = path

    replace[match.match] = path
  }))

  assets.forEach(asset => {
    const {subassets} = asset
    asset.subassets = subassets.map(({subasset}) => {
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
