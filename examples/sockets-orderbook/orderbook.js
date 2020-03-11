const Nash = require('../../build/main')
const blessed = require('blessed')

const USERNAME = ''
const PASSWORD = ''

const client = new Nash.Client(Nash.EnvironmentConfiguration.sandbox)
// Create a screen object.
const screen = blessed.screen({
  smartCSR: true
})
screen.key('q', function() {
  return process.exit(0)
})
screen.title = 'Orderbook'

const bidList = blessed.list({
  parent: screen,
  label: ' {bold}{green-fg}Bids{/green-fg}{/bold} ',
  tags: true,
  top: 0,
  mouse: true,
  right: 0,
  width: '100%',
  height: '50%',
  vi: true,
  border: 'line',
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan'
    },
    style: {
      inverse: true
    }
  },
  style: {
    item: {
      bg: 'green',
      fg: 'black',
      hover: {
        bg: 'cyan'
      }
    },
    selected: {
      bg: 'blue',
      bold: true
    }
  }
})

const askList = blessed.list({
  parent: screen,
  label: ' {bold}{red-fg}Asks{/red-fg}{/bold} ',
  tags: true,
  mouse: true,
  top: '50%',
  right: 0,
  width: '100%',
  height: '50%',
  vi: true,
  border: 'line',
  scrollbar: {
    ch: ' ',
    track: {
      bg: 'cyan'
    },
    style: {
      inverse: true
    }
  },
  style: {
    item: {
      bg: 'red',
      fg: 'black',
      hover: {
        bg: 'cyan'
      }
    },
    selected: {
      bg: 'blue',
      bold: true
    }
  }
})

async function run() {
  await client.login({
    email: USERNAME,
    password: PASSWORD
  })

  const initialOrderbookData = await client.getOrderBook('neo_eth')
  const askOrderBook = new Map()
  const bidOrderBook = new Map()
  const asks = initialOrderbookData.data.asks
  const bids = initialOrderbookData.data.bids
  asks.forEach(ask => askOrderBook.set(ask.price.amount, ask))
  bids.forEach(bid => bidOrderBook.set(bid.price.amount, bid))

  function update() {
    const askValues = [...askOrderBook.values()]
    askValues.sort(
      (l, r) => parseFloat(l.price.amount) - parseFloat(r.price.amount)
    )
    askList.setItems(
      askValues.map(
        ask =>
          `${ask.price.amount} ${ask.price.currencyA.toUpperCase()}: ${
            ask.amount.amount
          }`
      )
    )
    const bidValues = [...bidOrderBook.values()]
    bidValues.sort(
      (l, r) => parseFloat(l.price.amount) - parseFloat(r.price.amount)
    )
    bidList.setItems(
      bidValues.map(
        bid =>
          `${bid.price.amount} ${bid.price.currencyA.toUpperCase()}: ${
            bid.amount.amount
          }`
      )
    )
    screen.render()
  }
  update()
  try {
    const sub = client.subscribeToEvents()
    sub.onUpdatedOrderbook('neo_eth', order => {
      order.data.updatedOrderBook.asks.forEach(ask => {
        if (parseFloat(ask.amount.amount) === 0.0) {
          if (askOrderBook.has(ask.price.amount)) {
            askOrderBook.delete(ask.price.amount)
          }
        } else {
          askOrderBook.set(ask.price.amount, ask)
        }
      })
      order.data.updatedOrderBook.bids.forEach(bid => {
        if (parseFloat(bid.amount.amount) === 0.0) {
          if (bidOrderBook.has(bid.price.amount)) {
            bidOrderBook.delete(bid.price.amount)
          }
        } else {
          bidOrderBook.set(bid.price.amount, bid)
        }
      })
      update()
    })
  } catch (e) {
    console.error(e)
  }
}

run()
