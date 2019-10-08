const Web3 = require('web3')
const BN = require('bn.js')
const truffleCfg = require('../truffle.js')
const SportValueCoin = artifacts.require('tokens/SportValueCoin.sol')
const MintableToken = artifacts.require('tokens/MintableToken.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')
const FixedPriceSVCTokenSwap = artifacts.require('tokenswap/FixedPriceSVCTokenSwap.sol')
const SVCExclusiveSaleETH = artifacts.require('crowdsale/SVCExclusiveSaleETH.sol')
const SVCExclusiveSaleERC20 = artifacts.require('crowdsale/SVCExclusiveSaleERC20.sol')
const Payout = artifacts.require('payout/Payout.sol')
const web3Client = require('../lib/web3-client')
const conf = require('../conf')

// Deploy only on  test ad dev envs with this
module.exports = async function (deployer, network, accounts) {
  console.log('Truffle deployer network:', network)
  // deploy some test tokens if in dev
  if (network === 'development' && process.env.NODE_ENV !== 'test') {
    const web3 = new Web3(truffleCfg.networks[network])
    const footballPayoutsAccount = web3.eth.accounts.create()
    console.log('footballPayoutsAccount: ', footballPayoutsAccount.address)
    const basketballPayoutsAccount = web3.eth.accounts.create()
    console.log('basketballPayoutsAccount: ', basketballPayoutsAccount.address)
    const cricketPayoutsAccount = web3.eth.accounts.create()
    console.log('cricketPayoutsAccount: ', cricketPayoutsAccount.address)
    const userAccount = web3.eth.accounts.create()
    console.log('userAccount: ', userAccount)

    await deployer.deploy(SportValueCoin)
    console.log('SportValueCoin deployed at: ', SportValueCoin.address)
    let svc = await SportValueCoin.deployed()
    await svc.transfer(userAccount.address, new BN(10).pow(new BN(19)).toString(), {from: accounts[0]})

    await deployer.deploy(MintableToken)
    console.log('Test MintableToken deployed at: ', MintableToken.address)
    await deployer.deploy(SVCExclusiveSaleETH, 220, accounts[0], SportValueCoin.address)
    console.log('SVCExclusiveSaleE deployed at: ', SVCExclusiveSaleETH.address)
    await deployer.deploy(SVCExclusiveSaleERC20, 10000, accounts[0], MintableToken.address, SportValueCoin.address, 'TST')
    console.log('SVCExclusiveSaleERC20 deployed at: ', SVCExclusiveSaleERC20.address)
    await deployer.deploy(FixedPriceSVCTokenSwap, SportValueCoin.address, MintableToken.address, 'TSD')
    console.log('FixedPriceSVCTokenSwap deployed at: ', FixedPriceSVCTokenSwap.address)

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

    await web3Client.deployAssets(conf.tokens.football, tokenSwapFactoryFootball.address, tokenFactoryFootball.address, accounts[0])
    // web3Client.deployAssets(conf.tokens.basketball, tokenSwapFactoryBasketball.address, tokenFactoryBasketball.address, accounts[0])
    // web3Client.deployAssets(conf.tokens.cricket, tokenSwapFactoryCricket.address, tokenFactoryCricket.address, accounts[0])
    console.log(`Assets deployed`)
  }
}
