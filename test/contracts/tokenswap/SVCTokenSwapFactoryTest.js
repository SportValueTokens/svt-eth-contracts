const SVCoinContract = artifacts.require('tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('tokens/PlayerToken.sol')
const SVCTokenSwap = artifacts.require('tokenswap/SVCTokenSwap.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))

contract('SVCTokenSwapFactory', function (accounts) {
  let coinContract
  let playerTokenContract
  let exchangeFactory
  const creatorAccount = accounts[0]
  const DECIMALS = 18
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 'Lionel Messi Token', player_symbol, 'football', {from: creatorAccount})
    exchangeFactory = await SVCTokenSwapFactory.new('Football token swap', coinContract.address, 'football', {from: creatorAccount})
  }

  describe('createExchange', () => {
    beforeEach(init)

    it('should create a new Exchange', async () => {
      await exchangeFactory.createExchange(playerTokenContract.address, {from: creatorAccount})
      let exchangeAddress = await exchangeFactory.getExchange.call(playerTokenContract.address, {from: creatorAccount})
      let exchange = await SVCTokenSwap.at(exchangeAddress)
      let assetAddress = await exchange.getAssetAddress.call({from: creatorAccount})
      expect(assetAddress).to.equal(playerTokenContract.address)
      let token = await exchangeFactory.tokenList.call(0)
      expect(token).to.equal(playerTokenContract.address)
    })
  })
})
