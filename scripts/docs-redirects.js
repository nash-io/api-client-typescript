// Run after typedoc: keeps URLs from the old TypeDoc 0.17 site (and nash.io's /docs/ link) working.
const fs = require('fs')
const path = require('path')
const redirects = {
  'docs/index.html': '../index.html',
  'globals.html': 'modules.html',
  'classes/client.html': 'index.Client.html',
  'interfaces/clientoptions.html': 'client_environments.ClientOptions.html',
  'interfaces/environmentconfig.html': 'client_environments.EnvironmentConfig.html'
}
for (const [from, to] of Object.entries(redirects)) {
  const file = path.join('docs', from)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${to}"><a href="${to}">Documentation moved</a><script>location.replace(${JSON.stringify(to)} + location.hash)</script>\n`)
}
console.log('Preserved legacy documentation URLs')
