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

function init (SVCAddr) {
  if (!web3) {
    const host = truffleCfg.networks['development'].host
    const port = truffleCfg.networks['development'].port
    web3 = new Web3(`ws://${host}:${port}`)
  }
  SVC = new web3.eth.Contract(svcABI, SVCAddr)
}

async function deployAsset (symbol, name, amount, tokenFactoryAddr, tokenSwapFactoryAddr, callerAddr) {
  console.log(`Deploying token ${name} ${name} amount:${oneToken.mul(new BN(amount))}`)
  let tokenFactory = new web3.eth.Contract(playerTokenFactoryABI, tokenFactoryAddr)
  // we need to listen for AssetCreated event to know when the token was deployed on chain
  let p2 = new Promise(function (resolve, reject) {
    tokenFactory.once('AssetCreated', {}, function (err, event) {
      if (err) {
        reject(err)
      } else {
        console.log(`Token created on addr: ${event.returnValues.addr}, symbol: ${event.returnValues.symbol}`)
        deployTokenSwap(event.returnValues.addr, tokenSwapFactoryAddr, callerAddr).then(() => {
          return resolve(event)
        }).catch((err) => {
          reject(err)
        })
      }
    })
  })
  await tokenFactory.methods.createToken(amount.toString(), name, symbol).send({from: callerAddr, gas: 3000000})
  // wait for TX to be mined so we can obtain the address of the new token and pass it on to the tokenswap
  await p2
}

async function deployTokenSwap (tokenAddr, tokenSwapFactoryAddr, callerAddr) {
  console.log(`deployTokenSwap (${tokenAddr}, ${tokenSwapFactoryAddr}, ${callerAddr})`)
  let tokenSwapFactory = new web3.eth.Contract(exchangeFactoryABI, tokenSwapFactoryAddr)
  await tokenSwapFactory.methods.createTokenSwap(tokenAddr).send({from: callerAddr, gas: 3000000})
  // transfer SVC and asset to exchange
  await SVC.methods.transfer(tokenSwapFactoryAddr, oneToken.mul(new BN(1000)).toString()).send({from: callerAddr})
  let playerTokenContract = new web3.eth.Contract(playerTokenABI, tokenAddr)
  await playerTokenContract.methods.transfer(tokenSwapFactoryAddr, oneToken.mul(new BN(1000)).toString()).send({from: callerAddr})
}

async function setWins (wins, payoutContractAddr, callerAddr) {
  let payoutContract = new web3.eth.Contract(payoutABI, payoutContractAddr)
  const winningTokens = wins.map(win => win.token)
  const winningAmounts = wins.map(win => win.amount)
  await payoutContract.methods.updateWinners(winningTokens, winningAmounts).send({from: callerAddr})
}

async function deployAssets (tokens, tokenSwapFactoryAddr, tokenFactoryAddr, callerAddr) {
  await Promise.all(tokens.map(async function (token) {
    await deployAsset(token.symbol, token.name, oneToken.mul(new BN(token.amount)), tokenFactoryAddr, tokenSwapFactoryAddr, callerAddr)
  }))

  return Promise.all(tokens.map(async function (token) {
    console.log(`Deploying token ${JSON.stringify(token)} amount:${oneToken.mul(new BN(token.amount))}`)
    await deployAsset(token.symbol, token.name, oneToken.mul(new BN(token.amount)), tokenFactoryAddr, tokenSwapFactoryAddr, callerAddr)
  }))
}

async function getAvailablePayoutFunds (market, SVCAddr, payoutAccount) {
  return SVC.methods.balanceOf(payoutAccount).call({from: payoutAccount})
}

module.exports = {init, deployAsset, deployAssets, setWins, getAvailablePayoutFunds}
