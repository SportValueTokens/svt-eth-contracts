const BN = require('bn.js')
const Web3 = require('web3')
const truffleCfg = require('../truffle.js')
const playerTokenFactoryABI = require('../build/contracts/PlayerTokenFactory.json').abi
const exchangeFactoryABI = require('../build/contracts/SVCTokenSwapFactory.json').abi
const payoutABI = require('../build/contracts/Payout.json').abi
const svcABI = require('../build/contracts/PlayerToken.json').abi
let web3

const DECIMALS = 18
const oneToken = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))

async function deployAsset (symbol, name, amount, tokenSwapFactoryAddr, tokenFactoryAddr, callerAddr) {
  if (!web3) {
    web3 = new Web3(truffleCfg.networks['development'])
  }
  let tokenSwapFactory = new web3.eth.Contract(exchangeFactoryABI, tokenSwapFactoryAddr)
  let tokenFactory = new web3.eth.Contract(playerTokenFactoryABI, tokenFactoryAddr)

  let token = await tokenFactory.methods.createToken(amount, name, symbol, {from: callerAddr})
  let exchange = await tokenSwapFactory.methods.createExchange(token.address, {from: callerAddr})
  return {
    token: token,
    exchange: exchange
  }
}

async function setWins (wins, payoutContractAddr, callerAddr) {
  if (!web3) {
    web3 = new Web3(truffleCfg.networks['development'])
  }
  let payoutContract = new web3.eth.Contract(payoutABI, payoutContractAddr)
  const winningTokens = wins.map(win => win.token)
  const winningAmounts = wins.map(win => win.amount)
  await payoutContract.methods.updateWinners(winningTokens, winningAmounts, {from: callerAddr})
}

function deployAssets (tokens, tokenSwapFactoryAddr, tokenFactoryAddr, callerAddr) {
  Promise.all(tokens.map(async function (token) {
    console.log(`Deploying token ${JSON.stringify(token)}`)
    await deployAsset(token.symbol, token.name, oneToken.mul(new BN(token.amount)), tokenSwapFactoryAddr, tokenFactoryAddr, callerAddr)
  })).then(values => {
    console.log(values)
    return values
  }).catch(error => {
    console.error(error.message)
  })
}

async function getAvailablePayoutFunds (market, SVCAddr, payoutAccount) {
  if (!web3) {
    web3 = new Web3(truffleCfg.networks['development'])
  }
  let SVC = new web3.eth.Contract(svcABI, SVCAddr)
  return SVC.methods.balanceOf(payoutAccount).call({from: payoutAccount})
}

module.exports = {deployAsset, deployAssets, setWins, getAvailablePayoutFunds}
