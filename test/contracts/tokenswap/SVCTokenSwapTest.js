const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const SVCTokenSwap = artifacts.require('tokenswap/SVCTokenSwap.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const expectRevert = require('../helpers').expectRevert

contract('SVCTokenSwap', function (accounts) {
  let coinContract
  let playerTokenContract
  let exchangeContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const DECIMALS = 18
  const oneCoin = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const twoCoins = new BN(2).mul(new BN(10).pow(new BN(DECIMALS)))
  const tenCoins = new BN(10).mul(new BN(10).pow(new BN(DECIMALS)))
  const hundredCoins = new BN(100).mul(new BN(10).pow(new BN(DECIMALS)))
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 'Lionel Messi Token', player_symbol, 'football', {from: creatorAccount})
    // give each user 10 SVC
    await coinContract.transfer(user1Account, tenCoins, {from: creatorAccount})
    await coinContract.transfer(user2Account, tenCoins, {from: creatorAccount})

    exchangeContract = await SVCTokenSwap.new(coinContract.address, playerTokenContract.address, {from: creatorAccount})

    // transfer assets to user2
    playerTokenContract.transfer(user2Account, twoCoins)

    // transfer SVC and asset to exchange
    await coinContract.transfer(exchangeContract.address, tenCoins, {from: creatorAccount})
    await playerTokenContract.transfer(exchangeContract.address, tenCoins, {from: creatorAccount})
  }

  describe('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // first user1Account should approve the contract to spend its SVC
      let res = await coinContract.approve(exchangeContract.address, twoCoins, {from: user1Account})
      assert.ok(res)

      // then buy 1 player token
      await exchangeContract.buy(oneCoin, {from: user1Account})

      // we expect 1 token bought 1.00 SVC to be debited from user1 acc
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(9).mul(new BN(10).pow(new BN(DECIMALS))))
      let assetBalance = await playerTokenContract.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(oneCoin)

      // price should have increased
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(12222)
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend SVC
      let res = await coinContract.approve(exchangeContract.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchangeContract.buy(oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await coinContract.approve(exchangeContract.address, hundredCoins, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchangeContract.buy(hundredCoins, {from: user1Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(exchangeContract.buy(oneCoin, {from: user1Account}))
    })

    // should not be able to have 0 assets
  })

  describe('Asset sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      let res = await playerTokenContract.approve(exchangeContract.address, twoCoins, {from: user2Account})
      assert.ok(res)

      // then sell 1 token
      await exchangeContract.sell(oneCoin, {from: user2Account})

      // we expect 1 token to be sold for 1 SVC
      let coinBalance = await coinContract.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(1100).mul(new BN(10).pow(new BN(DECIMALS - 2))))
      let assetBalance = await playerTokenContract.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(oneCoin)

      // price should have decreased
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(8181)
    })

    it('should fail if seller has no tokens', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend player tokens
      let res = await playerTokenContract.approve(exchangeContract.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchangeContract.sell(oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await playerTokenContract.approve(exchangeContract.address, oneCoin, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchangeContract.sell(hundredCoins, {from: user1Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(exchangeContract.sell(oneCoin, {from: user2Account}))
    })

    // should not be able to have 0 assets
  })

  describe('addLiquidity', () => {
    beforeEach(init)

    it('should add liquidity to the exchange', async () => {
      // approve transfers
      let res = await playerTokenContract.approve(exchangeContract.address, tenCoins, {from: creatorAccount})
      assert.ok(res)
      res = await coinContract.approve(exchangeContract.address, tenCoins, {from: creatorAccount})
      assert.ok(res)

      await exchangeContract.addLiquidity(oneCoin, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await coinContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange SVC balance: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(11).mul(new BN(10).pow(new BN(DECIMALS))))
      let assetBalance = await playerTokenContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange Asset balance: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(new BN(11).mul(new BN(10).pow(new BN(DECIMALS))))

      // price should not have changed
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(10000)
    })

    it('should fail if not enough assets', async () => {
      // approve transfers
      let res = await playerTokenContract.approve(exchangeContract.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})
      assert.ok(res)
      res = await coinContract.approve(exchangeContract.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})
      assert.ok(res)

      // try to call addLiquidity
      await expectRevert(exchangeContract.addLiquidity(thousandCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(10000)
    })

    it('should fail if asset not approved', async () => {
      // approve transfers
      res = await coinContract.approve(exchangeContract.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})
      assert.ok(res)

      // try to call addLiquidity
      await expectRevert(exchangeContract.addLiquidity(oneCoin, {from: creatorAccount}))

      // price should not have changed
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(10000)
    })

  })

  describe('removeLiquidity', () => {
    beforeEach(init)

    it('should remove liquidity from the exchange', async () => {
      await exchangeContract.removeLiquidity(twoCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await coinContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange SVC balance: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(8).mul(new BN(10).pow(new BN(DECIMALS))))
      let assetBalance = await playerTokenContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange Asset balance: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(new BN(8).mul(new BN(10).pow(new BN(DECIMALS))))

      // price should not have changed
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(10000)
    })

    it('should remove all coins from the exchange', async () => {
      await exchangeContract.removeLiquidity(tenCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await coinContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange SVC balance: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(0)
      let assetBalance = await playerTokenContract.balanceOf.call(exchangeContract.address)
      console.log('Exchange Asset balance: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(0)
    })

    it('should fail if not enough assets', async () => {
      await expectRevert(exchangeContract.removeLiquidity(thousandCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchangeContract.getAssetPrice.call()
      expect(price).to.eq.BN(10000)
    })

  })
})
