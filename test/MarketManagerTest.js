const SVCoinContract = artifacts.require('SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('PlayerToken.sol')
const MarketManagerContract = artifacts.require('MarketManager.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
const expectRevert = require('./helpers').expectRevert

contract('MarketManager', function (accounts) {
  let coinContract
  let playerTokenContract
  let marketManagerContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const decimals = 18
  const oneCoin = new BigNumber(1).times(new BigNumber(10).pow(decimals))
  const twoCoins = new BigNumber(2).times(new BigNumber(10).pow(decimals))
  const tenCoins = new BigNumber(10).times(new BigNumber(10).pow(decimals))
  const initialPrice = new BigNumber(10).pow(4) // price is 1 SVC
  const id = 134820
  const symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(tenCoins, 'Lionel Messi Token', 'football', symbol, id, {from: creatorAccount})
    // give each user 10 SVC
    await coinContract.transfer(user1Account, tenCoins, {from: creatorAccount})
    await coinContract.transfer(user2Account, tenCoins, {from: creatorAccount})

    marketManagerContract = await MarketManagerContract.new('football', coinContract.address, {from: creatorAccount})
    await marketManagerContract.addAssetToMarket(playerTokenContract.address, initialPrice, {from: creatorAccount})

    // transfer assets to user2
    playerTokenContract.transfer(user2Account, twoCoins)

    // transfer SVC to contract
    await coinContract.transfer(marketManagerContract.address, tenCoins, {from: creatorAccount})

    // transfer ownership of asset to market manager contract in order to be able to mint
    playerTokenContract.transferOwnership(marketManagerContract.address, {from: creatorAccount})
  }

  describe('Token creation', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // check if user1 has money
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 initial SVC balance: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(tenCoins)
      // first user1Account should approve the contract to spend its SVC
      let res = await coinContract.approve(marketManagerContract.address, twoCoins, {from: user1Account})
      assert.ok(res)
      // then buy 1 token
      console.log(`User1 spends 1 coin (18 decimals) to buy id ${id}`)
      await marketManagerContract.createNewTokens(id, oneCoin, 10000, {from: user1Account})
      // we expect 1 token to bought 1.01 SVC to be debited from user1 acc
      coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(new BigNumber(9).times(new BigNumber(10).pow(decimals)))
      let tokenBalance = await playerTokenContract.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(oneCoin)

      // price should have increased
      let price = await marketManagerContract.getAssetPrice.call(id)
      console.log('New asset price: ', price.toString())
      expect(price).bignumber.to.equal(10100)
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      await expectRevert(marketManagerContract.createNewTokens(id, oneCoin, 10000, {from: user3Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(marketManagerContract.createNewTokens(id, oneCoin, 10000, {from: user1Account}))
    })
  })

  describe('Dividend Payout', () => {
    beforeEach(init)

    it('should fail if contract has no tokens', async () => {
      await expectRevert(marketManagerContract.payoutTo(user1Account, tenCoins.plus(oneCoin), {from: creatorAccount}))
    })

    it('should fail if call from non owner', async () => {
      await expectRevert(marketManagerContract.payoutTo(user1Account, oneCoin, {from: user2Account}))
    })

    it('should pay coins to beneficiary', async () => {
      await marketManagerContract.payoutTo(user1Account, oneCoin, {from: creatorAccount})
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      expect(coinBalance).bignumber.to.equal(tenCoins.plus(oneCoin))
    })
  })
})
