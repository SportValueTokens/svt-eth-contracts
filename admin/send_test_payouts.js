const BN = require('bn.js')
const web3Client = require('../lib/web3-client')
const conf = require('../conf.json')

async function updateWins (market) {
  const fundsAmount = await web3Client.getAvailablePayoutFunds(market, conf.ethereum.SVCAddr, conf.ethereum.markets[market].payoutAccount)
  const winningTokens = conf.wins[market]
  const totalScore = winningTokens.reduce((accumulator, currentValue) => accumulator + currentValue.score)
  const wins = winningTokens.map(win => ({
    token: win.token,
    amount: new BN(win.score).mul(fundsAmount).div(totalScore)
  }))
  web3Client.setWins(wins, conf.ethereum.markets[market].payoutAccount, conf.ethereum.ownerAccount)
}

updateWins('football').then(() => {
  console.log('Football wins updated')
  return 0
}).catch((err) => {
  console.log('Football wins updates failed', err)
})

updateWins('basketball').then(() => {
  console.log('Basketball wins updated')
  return 0
}).catch((err) => {
  console.log('Basketball wins updates failed', err)
})

updateWins('cricket').then(() => {
  console.log('Cricket wins updated')
  return 0
}).catch((err) => {
  console.log('Cricket wins updates failed', err)
})
