const Web3 = require('web3')
const BN = require('bn.js')
const truffleCfg = require('../truffle.js')
const SportValueCoin = artifacts.require('tokens/SportValueCoin.sol')
const MintableToken = artifacts.require('tokens/MintableToken.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const SVCExchange = artifacts.require('tokenswap/SVCExchange.sol')
const FixedPriceSVCTokenSwap = artifacts.require('tokenswap/FixedPriceSVCTokenSwap.sol')
const SVCExclusiveSaleETH = artifacts.require('crowdsale/SVCExclusiveSaleETH.sol')
const SVCExclusiveSaleERC20 = artifacts.require('crowdsale/SVCExclusiveSaleERC20.sol')
const Payout = artifacts.require('payout/Payout.sol')

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

    await deployer.deploy(PlayerTokenFactory, 1, 'football')
    console.log('Football PlayerTokenFactory deployed at: ', PlayerTokenFactory.address)
    await deployer.deploy(SVCExchange, 1, 'football', SportValueCoin.address)
    console.log('Football SVCExchange deployed at: ', SVCExchange.address)
    await deployer.deploy(Payout, 1, 'football', SportValueCoin.address)
    console.log('Football Payout deployed at: ', Payout.address)
  }
}
