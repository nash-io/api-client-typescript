const fs = require('fs')
const path = require('path')
const out = path.resolve('website/.vitepress/dist')
const base = '/api-client-typescript/'
const redirects = {
  'docs/index.html': '',
  'globals.html': 'api/',
  'classes/client.html': 'api/index/classes/Client.html',
  'interfaces/clientoptions.html': 'api/client/environments/interfaces/ClientOptions.html',
  'interfaces/environmentconfig.html': 'api/client/environments/interfaces/EnvironmentConfig.html'
}
for (const [from, to] of Object.entries(redirects)) {
  const target = base + to
  const file = path.join(out, from)
  const globals = from === 'globals.html'
    ? `if (location.hash.startsWith('#environmentconfiguration')) target = ${JSON.stringify(base + 'api/client/environments/variables/EnvironmentConfiguration.html')}; else if (location.hash === '#unlimited_approval') target = ${JSON.stringify(base + 'api/index/variables/UNLIMITED_APPROVAL.html')};`
    : ''
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Documentation moved</title><meta http-equiv="refresh" content="0;url=${target}"><a href="${target}">Continue to the Nash SDK documentation</a><script>let target = ${JSON.stringify(target)};${globals}location.replace(target${from === 'globals.html' ? '' : ' + location.hash'});</script></html>\n`)
}
fs.writeFileSync(path.join(out, '.nojekyll'), '')
console.log('Preserved legacy docs, globals, Client, ClientOptions, and EnvironmentConfig URLs')
