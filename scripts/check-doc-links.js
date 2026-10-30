// Run after yarn doc: checks the emitted site, not Markdown source.
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const root = path.resolve('website/.vitepress/dist')
const origin = 'https://nash-io.github.io'
const base = '/api-client-typescript/'
const files = []
function collect(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(file)
    else if (file.endsWith('.html')) files.push(file)
  }
}
collect(root)
let checked = 0
const errors = []
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  const page = new URL(base + path.relative(root, file).split(path.sep).join('/'), origin)
  for (const match of html.matchAll(/<(?:a|link|script)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'), page)
    if (url.origin !== origin) continue
    checked++
    if (!url.pathname.startsWith(base)) {
      errors.push(`${page.pathname}: outside deployment base: ${url.pathname}`)
      continue
    }
    const relative = decodeURIComponent(url.pathname.slice(base.length))
    const target = path.join(root, url.pathname.endsWith('/') ? relative + 'index.html' : relative)
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      errors.push(`${page.pathname}: missing ${url.pathname}`)
    } else if (url.hash && target.endsWith('.html')) {
      const id = decodeURIComponent(url.hash.slice(1))
      const content = fs.readFileSync(target, 'utf8')
      if (!content.includes(`id="${id}"`)) errors.push(`${page.pathname}: missing anchor ${url.pathname}${url.hash}`)
    }
  }
}
assert.deepStrictEqual(errors, [], errors.join('\n'))
console.log(`${files.length} built pages; ${checked} internal links/assets/anchors verified under ${base}`)
