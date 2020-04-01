const Nash = require('@neon-exchange/api-client-typescript')
const blessed = require('blessed')

const client = new Nash.Client(Nash.EnvironmentConfiguration.production)

// Create a screen object.
const screen = blessed.screen({
  smartCSR: true
})
screen.key('q', function() {
  return process.exit(0)
})
screen.title = 'Orderbook'

const askList = blessed.list({
  parent: screen,
  label: ' {bold}{red-fg}Asks{/red-fg}{/bold} ',
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

const bidList = blessed.list({
  parent: screen,
  label: ' {bold}{green-fg}Bids{/green-fg}{/bold} ',
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

async function run() {
  const initialOrderbookData = await client.getOrderBook('neo_eth')
  const askOrderBook = new Map()
  const bidOrderBook = new Map()
  const asks = initialOrderbookData.asks
  const bids = initialOrderbookData.bids
  asks.forEach(ask => askOrderBook.set(ask.price.amount, ask))
  bids.forEach(bid => bidOrderBook.set(bid.price.amount, bid))

  function update() {
    const askValues = [...askOrderBook.values()]
    askValues.sort(
      (r, l) => parseFloat(l.price.amount) - parseFloat(r.price.amount)
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
      (r, l) => parseFloat(l.price.amount) - parseFloat(r.price.amount)
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
    const sub = client.createSocketConnection()
    sub.onUpdatedOrderbook({ marketName: 'neo_eth' }, {
      onResult: order => {
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
      }
    })
  } catch (e) {
    console.error(e)
  }
}
try {
  run()
}catch(e) {
  console.log(e)
}
