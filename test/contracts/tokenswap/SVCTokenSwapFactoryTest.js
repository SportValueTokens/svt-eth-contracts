const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const SVCTokenSwap = artifacts.require('tokenswap/SVCTokenSwap.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
const expectRevert = require('../helpers').expectRevert

contract('SVCTokenSwapFactory', function (accounts) {
  let coinContract
  let playerTokenContract
  let exchangeFactory
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const DECIMALS = 18
  const oneCoin = new BigNumber(1).times(new BigNumber(10).pow(DECIMALS))
  const twoCoins = new BigNumber(2).times(new BigNumber(10).pow(DECIMALS))
  const tenCoins = new BigNumber(10).times(new BigNumber(10).pow(DECIMALS))
  const hundredCoins = new BigNumber(100).times(new BigNumber(10).pow(DECIMALS))
  const thousandCoins = new BigNumber(1000).times(new BigNumber(10).pow(DECIMALS))
  const player_id = 134820
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 'Lionel Messi Token', player_symbol, player_id, 'football', {from: creatorAccount})
    exchangeFactory = await SVCTokenSwapFactory.new("Football", coinContract.address, {from: creatorAccount})
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
