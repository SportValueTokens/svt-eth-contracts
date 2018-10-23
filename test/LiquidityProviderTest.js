const SVCoinContract = artifacts.require('SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('PlayerToken.sol')
const LiquidityContract = artifacts.require('LiquidityProvider.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
const expectRevert = require('./helpers').expectRevert

contract('LiquidityProvider', function (accounts) {
  let coinContract
  let playerTokenContract
  let liquidityContract
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
    playerTokenContract = await PlayerTokenContract.new(tenCoins, 'Lionel Messi Token', symbol, id, {from: creatorAccount})
    // give each user 10 SVC
    await coinContract.transfer(user1Account, tenCoins, {from: creatorAccount})
    await coinContract.transfer(user2Account, tenCoins, {from: creatorAccount})

    liquidityContract = await LiquidityContract.new(coinContract.address, {from: creatorAccount})
    await liquidityContract.addAssetToMarket(playerTokenContract.address, initialPrice, {from: creatorAccount})

    // transfer assets to liquidity contract and user2
    playerTokenContract.transfer(liquidityContract.address, oneCoin)
    playerTokenContract.transfer(user2Account, twoCoins)

    // transfer SVC to contract
    await coinContract.transfer(liquidityContract.address, tenCoins, {from: creatorAccount})
  }

  describe('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // check if user1 has money
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 initial SVC balance: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(tenCoins)
      // first user1Account should approve the contract to spend its SVC
      let res = await coinContract.approve(liquidityContract.address, twoCoins, {from: user1Account})
      assert.ok(res)
      // then buy 1 token
      await liquidityContract.buy(id, oneCoin, {from: user1Account})
      // we expect 1 token to bought 1.01 SVC to be debited from user1 acc
      coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(new BigNumber(899).times(new BigNumber(10).pow(decimals - 2)))
      let tokenBalance = await playerTokenContract.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(oneCoin)
      // TODO assert price
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      await expectRevert(liquidityContract.buy(id, oneCoin, {from: user3Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(liquidityContract.buy(id, oneCoin, {from: user1Account}))
    })
  })

  describe('Asset sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // check if user2 has tokens
      let tokenBalance = await playerTokenContract.balanceOf.call(user2Account)
      console.log('User2 initial asset token balance: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(twoCoins)
      // user2 needs to allow the liquidity contract to spend his tokens
      let res = await playerTokenContract.approve(liquidityContract.address, twoCoins, {from: user2Account})
      assert.ok(res)
      // then sell 1 token
      await liquidityContract.sell(id, oneCoin, {from: user2Account})
      // we expect 1 token to be sold for 0.99 SVC
      let coinBalance = await coinContract.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(new BigNumber(1099).times(new BigNumber(10).pow(decimals - 2)))
      tokenBalance = await playerTokenContract.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(oneCoin)

      // TODO assert price
    })

    it('should fail if seller has no tokens', async () => {
      const user3Account = accounts[3]
      await expectRevert(liquidityContract.sell(id, oneCoin, {from: user3Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(liquidityContract.buy(id, oneCoin, {from: user2Account}))
    })
  })

  describe('Dividend Payout', () => {
    beforeEach(init)

    it('should fail if contract has no tokens', async () => {
      await expectRevert(liquidityContract.payoutTo(user1Account, tenCoins.plus(oneCoin), {from: creatorAccount}))
    })

    it('should fail if call from non owner', async () => {
      await expectRevert(liquidityContract.payoutTo(user1Account, oneCoin, {from: user2Account}))
    })

    it('should pay coins to beneficiary', async () => {
      await liquidityContract.payoutTo(user1Account, oneCoin, {from: creatorAccount})
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      expect(coinBalance).bignumber.to.equal(tenCoins.plus(oneCoin))
    })
  })
})
