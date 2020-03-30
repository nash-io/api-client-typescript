const Nash = require('../build/main')

const client = new Nash.Client(
  Nash.EnvironmentConfiguration[process.env.NASH_ENV]
)
async function run() {
  await client.login(require('./key.json'))

  // for (let i = 0; i < 1000; i++) {
  //   await client.listAccountBalances(true)
  //   global.gc()
  //   const used = process.memoryUsage().heapUsed / 1024 / 1024
  //   console.log(`The script uses approximately ${used} MB`)
  // }
  for (let i = 0; i < 1000; i++) {
    await client.getSignAndSyncStates()
    global.gc()
    const used = process.memoryUsage().heapUsed
    console.log(used)
  }
}

run()
