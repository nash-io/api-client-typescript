module.exports.wait = n => new Promise(r => setTimeout(r, n))

module.exports.login = async (client) => {
  if (process.env.NASH_MODE==="full") {
    await client.legacyLogin(require('./login.json'))
  } else {
    await client.login(require('./key.json'))
  }
}
