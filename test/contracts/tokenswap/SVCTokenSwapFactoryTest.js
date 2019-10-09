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
  let tokenSwapFactory
  const creatorAccount = accounts[0]
  const DECIMALS = 18
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 1, player_symbol, 'Lionel Messi Token', 'football', {from: creatorAccount})
    tokenSwapFactory = await SVCTokenSwapFactory.new(coinContract.address, 1, 'football', {from: creatorAccount})
  }

  describe('createTokenSwap', () => {
    beforeEach(init)

    it('should create a new TokenSwap', async () => {
      await tokenSwapFactory.createTokenSwap(playerTokenContract.address, {from: creatorAccount})
      let nbTokens = await tokenSwapFactory.getTokenCount.call()
      expect(nbTokens).to.eq.BN(new BN(1))
      let tokenSwapFactoryAddress = await tokenSwapFactory.tokenSwaps.call(playerTokenContract.address, {from: creatorAccount})
      let tokenSwap = await SVCTokenSwap.at(tokenSwapFactoryAddress)
      let assetAddress = await tokenSwap.asset.call({from: creatorAccount})
      expect(assetAddress).to.equal(playerTokenContract.address)
      let token = await tokenSwapFactory.tokenList.call(0)
      expect(token).to.equal(playerTokenContract.address)
    })
  })
})
