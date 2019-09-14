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

function initWeb3 () {
  if (!web3) {
    const host = truffleCfg.networks['development'].host
    const port = truffleCfg.networks['development'].port
    web3 = new Web3(`ws://${host}:${port}`)
  }
}

async function deployAsset (symbol, name, amount, tokenFactoryAddr, callerAddr) {
  console.log(`deployAsset (${symbol}, ${name}, ${amount}, ${tokenFactoryAddr}, ${callerAddr})`)
  initWeb3()
  let tokenFactory = new web3.eth.Contract(playerTokenFactoryABI, tokenFactoryAddr)
  return tokenFactory.methods.createToken(amount.toString(), name, symbol).send({from: callerAddr, gas: 2000000})
  // TODO listen for event
}

async function deployTokenSwap (tokenAddr, tokenSwapFactoryAddr, callerAddr) {
  console.log(`deployTokenSwap (${tokenAddr}, ${tokenSwapFactoryAddr}, ${callerAddr})`)
  initWeb3()
  let tokenSwapFactory = new web3.eth.Contract(exchangeFactoryABI, tokenSwapFactoryAddr)
  await tokenSwapFactory.methods.createExchange(tokenAddr).send({from: callerAddr})
}

async function setWins (wins, payoutContractAddr, callerAddr) {
  if (!web3) {
    web3 = new Web3(truffleCfg.networks['development'])
  }
  let payoutContract = new web3.eth.Contract(payoutABI, payoutContractAddr)
  const winningTokens = wins.map(win => win.token)
  const winningAmounts = wins.map(win => win.amount)
  await payoutContract.methods.updateWinners(winningTokens, winningAmounts).send({from: callerAddr})
}

function deployAssets (tokens, tokenSwapFactoryAddr, tokenFactoryAddr, callerAddr) {
  Promise.all(tokens.map(async function (token) {
    console.log(`Deploying token ${JSON.stringify(token)} amount:${oneToken.mul(new BN(token.amount))}`)
    await deployAsset(token.symbol, token.name, oneToken.mul(new BN(token.amount)), tokenFactoryAddr, callerAddr)
  })).then(values => {
    console.log(`Assets deployed`)
    return values
  }).catch(error => {
    console.error('Failed to deploy assets:', error)
  })
}

async function getAvailablePayoutFunds (market, SVCAddr, payoutAccount) {
  if (!web3) {
    web3 = new Web3(truffleCfg.networks['development'])
  }
  let SVC = new web3.eth.Contract(svcABI, SVCAddr)
  return SVC.methods.balanceOf(payoutAccount).call({from: payoutAccount})
}

module.exports = {deployAsset, deployTokenSwap, deployAssets, setWins, getAvailablePayoutFunds}
