const StableCoin = artifacts.require('./tokens/StableCoin.sol')
const PlayerToken = artifacts.require('./tokens/PlayerToken.sol')
const SVCExchange = artifacts.require('./exchange/SVCExchange.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const expectRevert = require('../helpers').expectRevert

contract('SVCExchange', function (accounts) {
  let stableCoin
  let asset1, asset2
  let exchange
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const feesAccount = accounts[3]
  const DECIMALS = 18
  const oneCoin = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const twoCoins = new BN(2).mul(new BN(10).pow(new BN(DECIMALS)))
  const tenCoins = new BN(10).mul(new BN(10).pow(new BN(DECIMALS)))
  const hundredCoins = new BN(100).mul(new BN(10).pow(new BN(DECIMALS)))
  const millionCoins = new BN(1000000).mul(new BN(10).pow(new BN(DECIMALS)))

  let init = async () => {
    stableCoin = await StableCoin.new(millionCoins, {from: creatorAccount})
    asset1 = await PlayerToken.new(millionCoins, 1, 'FLMS', 'Lionel Messi Token', 'football', {from: creatorAccount})
    asset2 = await PlayerToken.new(millionCoins, 2, 'PGB', 'Paul Pogba Token', 'football', {from: creatorAccount})
    // give each user 10 SVC
    await stableCoin.transfer(user1Account, tenCoins, {from: creatorAccount})
    await stableCoin.transfer(user2Account, tenCoins, {from: creatorAccount})

    exchange = await SVCExchange.new(1, 'football', stableCoin.address, feesAccount, {from: creatorAccount})

    // transfer assets to user2
    asset1.transfer(user2Account, tenCoins, {from: creatorAccount})
    asset2.transfer(user2Account, tenCoins, {from: creatorAccount})

    // transfer cash and assets to exchange
    await stableCoin.approve(exchange.address, tenCoins.mul(new BN(2)), {from: creatorAccount})
    await asset1.approve(exchange.address, tenCoins, {from: creatorAccount})
    await asset2.approve(exchange.address, tenCoins, {from: creatorAccount})
    await exchange.addCash(asset1.address, tenCoins, {from: creatorAccount})
    await exchange.addAssets(asset1.address, tenCoins, {from: creatorAccount})
    await exchange.addCash(asset2.address, tenCoins, {from: creatorAccount})
    await exchange.addAssets(asset2.address, tenCoins, {from: creatorAccount})
  }

  describe('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with stable coin', async () => {
      // first user1Account should approve the contract to spend its cash
      await stableCoin.approve(exchange.address, twoCoins, {from: user1Account})

      // then buy 1 player token
      await exchange.buy(asset1.address, oneCoin, {from: user1Account})

      // we expect 1.12 USD to be debited from user1 account
      let coinBalance = await stableCoin.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(88889).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      let assetBalance = await asset1.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(oneCoin)
      assetBalance = await asset2.balanceOf.call(user1Account)
      expect(assetBalance).to.eq.BN(0)

      // price should have increased
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(12345)
      price = await exchange.getAssetPrice.call(asset2.address, 0, false)
      expect(price).to.eq.BN(10000)
    })

    it('price delta should depend on volume', async () => {
      // first user1Account should approve the contract to spend its SVC
      await stableCoin.approve(exchange.address, tenCoins, {from: user1Account})

      // then buy 2 player1 tokens amd 1 player2 token
      await exchange.buy(asset1.address, twoCoins, {from: user1Account})
      await exchange.buy(asset2.address, oneCoin, {from: user1Account})

      // we expect 2.5 SVC to be added to token1 balance
      let coinBalance = await exchange.balanceOf.call(asset1.address)
      expect(coinBalance).to.eq.BN(new BN(125000).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      // we expect 1.11 SVC to be added to token2 balance
      coinBalance = await exchange.balanceOf.call(asset2.address)
      expect(coinBalance).to.eq.BN(new BN(111111).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      // check total SVC balance
      coinBalance = await stableCoin.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(63889).mul(new BN(10).pow(new BN(DECIMALS - 4))))

      // price should have increased more
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(15625)
      price = await exchange.getAssetPrice.call(asset2.address, 0, true)
      expect(price).to.eq.BN(12345)
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend SVC
      let res = await stableCoin.approve(exchange.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchange.buy(asset1.address, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await stableCoin.approve(exchange.address, hundredCoins, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchange.buy(asset1.address, hundredCoins, {from: user1Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(exchange.buy(asset1.address, oneCoin, {from: user1Account}))
    })
  })

  describe('Asset sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      await asset1.approve(exchange.address, twoCoins, {from: user2Account})

      // then sell 1 token
      await exchange.sell(asset1.address, oneCoin, {from: user2Account})

      // we expect 1 token to be sold for 1.09 SVC
      let coinBalance = await stableCoin.balanceOf.call(user2Account)
      console.log('User2 SVC balance after sale: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(109090).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      let assetBalance = await asset1.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(tenCoins.sub(oneCoin))
      assetBalance = await asset2.balanceOf.call(user2Account)
      expect(assetBalance).to.eq.BN(tenCoins)

      // price should have decreased
      let price = await exchange.getAssetPrice.call(asset1.address, 0, false)
      expect(price).to.eq.BN(8264)
      price = await exchange.getAssetPrice.call(asset2.address, 0, false)
      expect(price).to.eq.BN(10000)
    })

    it('price delta should depend on volume', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      await asset1.approve(exchange.address, tenCoins, {from: user2Account})
      await asset2.approve(exchange.address, tenCoins, {from: user2Account})

      // then sell 2 tokens
      await exchange.sell(asset1.address, twoCoins, {from: user2Account})
      await exchange.sell(asset2.address, oneCoin, {from: user2Account})

      // we expect 1.67 SVC to be removed from token1 balance
      let coinBalance = await exchange.balanceOf.call(asset1.address)
      expect(coinBalance).to.eq.BN(new BN(83334).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      // we expect 0.91 SVC to be removed from token2 balance
      coinBalance = await exchange.balanceOf.call(asset2.address)
      expect(coinBalance).to.eq.BN(new BN(90910).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      // check total SVC balance
      coinBalance = await stableCoin.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(125756).mul(new BN(10).pow(new BN(DECIMALS - 4))))

      // price should have decreased
      let price = await exchange.getAssetPrice.call(asset1.address, 0, false)
      expect(price).to.eq.BN(6944)
      price = await exchange.getAssetPrice.call(asset2.address, 0, false)
      expect(price).to.eq.BN(8264)
    })

    it('should fail if seller has no tokens', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend player tokens
      let res = await asset1.approve(exchange.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchange.sell(asset1.address, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await asset1.approve(exchange.address, oneCoin, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchange.sell(asset1.address, hundredCoins, {from: user1Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(exchange.sell(asset1.address, oneCoin, {from: user2Account}))
    })

    // should not be able to have 0 assets
  })

  describe('addLiquidity', () => {
    beforeEach(init)

    it('should add liquidity to the exchange', async () => {
      // approve transfers
      await asset1.approve(exchange.address, tenCoins, {from: creatorAccount})
      await stableCoin.approve(exchange.address, tenCoins, {from: creatorAccount})

      await exchange.addLiquidity(asset1.address, oneCoin, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await stableCoin.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(new BN(21).mul(oneCoin))
      coinBalance = await exchange.balanceOf.call(asset1.address)
      expect(coinBalance).to.eq.BN(oneCoin.mul(new BN(11)))
      let assetBalance = await asset1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(new BN(11).mul(oneCoin))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should fail if not enough assets', async () => {
      // approve transfers
      await asset1.approve(exchange.address, millionCoins.mul(new BN(2)), {from: creatorAccount})
      await stableCoin.approve(exchange.address, millionCoins.mul(new BN(2)), {from: creatorAccount})

      // try to call addLiquidity
      await expectRevert(exchange.addLiquidity(asset1.address, millionCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should fail if asset not approved', async () => {
      // approve transfers
      res = await stableCoin.approve(exchange.address, millionCoins.mul(new BN(2)), {from: creatorAccount})
      assert.ok(res)

      // try to call addLiquidity
      await expectRevert(exchange.addLiquidity(asset1.address, oneCoin, {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

  })

  describe('removeLiquidity', () => {
    beforeEach(init)

    it('should remove liquidity from the exchange', async () => {
      await exchange.removeLiquidity(asset1.address, twoCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await stableCoin.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(new BN(18).mul(oneCoin))
      coinBalance = await exchange.balanceOf.call(asset1.address)
      expect(coinBalance).to.eq.BN(new BN(8).mul(oneCoin))
      let assetBalance = await asset1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(new BN(8).mul(oneCoin))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should remove all coins from the exchange', async () => {
      await exchange.removeLiquidity(asset1.address, tenCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await stableCoin.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(tenCoins)
      coinBalance = await exchange.balanceOf.call(asset1.address)
      expect(coinBalance).to.eq.BN(0)
      let assetBalance = await asset1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(0)
    })

    it('should fail if not enough assets', async () => {
      await expectRevert(exchange.removeLiquidity(asset1.address, millionCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(asset1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })
  })
})
