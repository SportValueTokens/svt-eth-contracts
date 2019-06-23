const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const SVCTokenSwap = artifacts.require('tokenswap/SVCTokenSwap.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect

contract('SVCTokenSwapFactory', function (accounts) {
  let coinContract
  let playerTokenContract
  let exchangeFactory
  const creatorAccount = accounts[0]
  const DECIMALS = 18
  const thousandCoins = new BigNumber(1000).times(new BigNumber(10).pow(DECIMALS))
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 'Lionel Messi Token', player_symbol, 'football', {from: creatorAccount})
    exchangeFactory = await SVCTokenSwapFactory.new('Football', coinContract.address, {from: creatorAccount})
  }

  describe('createExchange', () => {
    beforeEach(init)

    it('should create a new Exchange', async () => {
      await exchangeFactory.createExchange(playerTokenContract.address, {from: creatorAccount})
      let exchangeAddress = await exchangeFactory.getExchange.call(playerTokenContract.address, {from: creatorAccount})
      let exchange = SVCTokenSwap.at(exchangeAddress)
      let assetAddress = await exchange.getAssetAddress.call({from: creatorAccount})
      expect(assetAddress).to.equal(playerTokenContract.address)
      let token = await exchangeFactory.tokenList.call(0)
      expect(token).to.equal(playerTokenContract.address)
    })
  })
})
