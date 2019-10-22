const BN = require('bn.js')
const Web3 = require('web3')
const truffleCfg = require('../truffle.js')
const playerTokenFactoryABI = require('../build/contracts/PlayerTokenFactory.json').abi
const playerTokenABI = require('../build/contracts/PlayerToken.json').abi
const exchangeFactoryABI = require('../build/contracts/SVCTokenSwapFactory.json').abi
const payoutABI = require('../build/contracts/Payout.json').abi
const svcABI = require('../build/contracts/PlayerToken.json').abi
const DECIMALS = 18
const oneToken = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))

let web3
let SVC
let tokenFactory
let tokenSwapFactory
let ownerAddr
let payoutContract

function init (SVCAddr, tokenFactoryAddr, tokenSwapFactoryAddr, payoutContractAddr, account) {
  if (!web3) {
    const host = truffleCfg.networks['development'].host
    const port = truffleCfg.networks['development'].port
    web3 = new Web3(`ws://${host}:${port}`)
  }
  ownerAddr = account
  SVC = new web3.eth.Contract(svcABI, SVCAddr)
  tokenFactory = new web3.eth.Contract(playerTokenFactoryABI, tokenFactoryAddr)
  tokenSwapFactory = new web3.eth.Contract(exchangeFactoryABI, tokenSwapFactoryAddr)
  payoutContract = new web3.eth.Contract(payoutABI, payoutContractAddr)

  // register event listeners
  // we need to listen for AssetCreated event to know when the token was deployed on chain
  tokenFactory.events.AssetCreated()
    .on('data', function (event) {
      console.log(`Token created on addr: ${event.returnValues.addr}, symbol: ${event.returnValues.symbol}`)
      deployTokenSwap(event.returnValues.addr).then(() => {
        return true
      }).catch((err) => {
        console.error('Error while processing deployTokenSwap', err)
      })
    })
    .on('error', function (err) {
      console.error('Error while processing AssetCreated event', err)
    })
  // we need to listen for TokenSwapCreated event to know when the tokenswap was deployed on chain
  tokenSwapFactory.events.TokenSwapCreated()
    .on('data', function (event) {
      console.log(`TokenSwap created on addr: ${event.returnValues.addr}, assetAddr: ${event.returnValues.assetAddr}`)
      sendTokensToTokenSwap(event.returnValues.addr, event.returnValues.assetAddr).then(() => {
        return true
      }).catch((err) => {
        console.error('Error while processing sendTokensToTokenSwap', err)
      })
    })
    .on('error', function (err) {
      console.error('Error while processing TokenSwapCreated event', err)
    })
}

async function deployAsset (symbol, name, amount) {
  console.log(`Deploying token ${symbol} ${name} amount:${amount}`)
  await tokenFactory.methods.createToken(amount.toString(), name, symbol).send({from: ownerAddr, gas: 3000000})
}

async function sendTokensToTokenSwap (tokenSwapAddr, tokenAddr) {
  await SVC.methods.transfer(tokenSwapAddr, oneToken.mul(new BN(1000)).toString()).send({from: ownerAddr})
  let playerTokenContract = new web3.eth.Contract(playerTokenABI, tokenAddr)
  await playerTokenContract.methods.transfer(tokenSwapAddr, oneToken.mul(new BN(1000)).toString()).send({from: ownerAddr})
  console.log(`Sent 1000 SVC and PlayerTokens to TokenSwap at ${tokenSwapAddr}`)
}

async function deployTokenSwap (tokenAddr) {
  console.log(`deployTokenSwap: tokenAddr: ${tokenAddr}`)
  await tokenSwapFactory.methods.createTokenSwap(tokenAddr).send({from: ownerAddr, gas: 3000000})
}

async function setWins (wins, payoutContractAddr, callerAddr) {
  const winningTokens = wins.map(win => win.token)
  const winningAmounts = wins.map(win => win.amount)
  await payoutContract.methods.updateWinners(winningTokens, winningAmounts).send({from: callerAddr})
}

async function deployAssets (tokens) {
  await Promise.all(tokens.map(async function (token) {
    await deployAsset(token.symbol, token.name, oneToken.mul(new BN(token.amount)))
  }))
}

async function getAvailablePayoutFunds () {
  return SVC.methods.balanceOf(payoutContract.address).call({from: payoutContract.address})
}

module.exports = {init, deployAsset, deployAssets, setWins, getAvailablePayoutFunds}
