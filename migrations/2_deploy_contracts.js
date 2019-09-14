const Web3 = require('web3')
const truffleCfg = require('../truffle.js')
const SportValueCoin = artifacts.require('tokens/SportValueCoin.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')
const Payout = artifacts.require('payout/Payout.sol')
const web3Client = require('../lib/web3-client')
const conf = require('../conf')

// Deploy only on  test ad dev envs with this
module.exports = async function (deployer, network, accounts) {
  console.log('Truffle deployer network:', network)
  if (network === 'development') {
    const web3 = new Web3(truffleCfg.networks[network])
    const footballPayoutsAccount = web3.eth.accounts.create()
    console.log('footballPayoutsAccount: ', footballPayoutsAccount.address)
    const basketballPayoutsAccount = web3.eth.accounts.create()
    console.log('basketballPayoutsAccount: ', basketballPayoutsAccount.address)
    const cricketPayoutsAccount = web3.eth.accounts.create()
    console.log('cricketPayoutsAccount: ', cricketPayoutsAccount.address)

    await deployer.deploy(SportValueCoin)
    const tokenFactoryFootball = await deployer.deploy(PlayerTokenFactory, 1, 'football')
    console.log('Football PlayerTokenFactory deployed at: ', PlayerTokenFactory.address)
    const tokenSwapFactoryFootball = await deployer.deploy(SVCTokenSwapFactory, SportValueCoin.address, 1, 'football')
    console.log('Football SVCTokenSwapFactory deployed at: ', SVCTokenSwapFactory.address)
    await deployer.deploy(Payout, 1, 'football', SportValueCoin.address, footballPayoutsAccount.address)
    console.log('Football Payout deployed at: ', Payout.address)

    // const tokenFactoryBasketball = await deployer.deploy(PlayerTokenFactory, 2, 'basketball')
    // const tokenSwapFactoryBasketball = await deployer.deploy(SVCTokenSwapFactory, SportValueCoin.address, 2, 'basketball')
    // await deployer.deploy(Payout, 2, 'basketball', SportValueCoin.address, basketballPayoutsAccount.address)
    // const tokenFactoryCricket = await deployer.deploy(PlayerTokenFactory, 3, 'cricket')
    // const tokenSwapFactoryCricket = await deployer.deploy(SVCTokenSwapFactory, SportValueCoin.address, 3, 'cricket')
    // await deployer.deploy(Payout, 3, 'cricket', SportValueCoin.address, cricketPayoutsAccount.address)

    web3Client.deployAssets(conf.tokens.football, tokenSwapFactoryFootball.address, tokenFactoryFootball.address, accounts[0])
    // web3Client.deployAssets(conf.tokens.basketball, tokenSwapFactoryBasketball.address, tokenFactoryBasketball.address, accounts[0])
    // web3Client.deployAssets(conf.tokens.cricket, tokenSwapFactoryCricket.address, tokenFactoryCricket.address, accounts[0])
  } else {
    console.log('We are not happy to deploy with truffle on main net')
  }
}
