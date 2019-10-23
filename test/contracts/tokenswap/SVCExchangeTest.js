const SVC = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const SVCExchange = artifacts.require('tokenswap/SVCExchange.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const expectRevert = require('../helpers').expectRevert

contract('SVCExchange', function (accounts) {
  let svc
  let token1, token2
  let exchange
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const DECIMALS = 18
  const oneCoin = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const twoCoins = new BN(2).mul(new BN(10).pow(new BN(DECIMALS)))
  const tenCoins = new BN(10).mul(new BN(10).pow(new BN(DECIMALS)))
  const hundredCoins = new BN(100).mul(new BN(10).pow(new BN(DECIMALS)))
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))

  let init = async () => {
    svc = await SVC.new({from: creatorAccount})
    token1 = await PlayerTokenContract.new(thousandCoins, 1, 'FLMS', 'Lionel Messi Token', 'football', {from: creatorAccount})
    token2 = await PlayerTokenContract.new(thousandCoins, 2, 'PGB', 'Paul Pogba Token', 'football', {from: creatorAccount})
    // give each user 10 SVC
    await svc.transfer(user1Account, tenCoins, {from: creatorAccount})
    await svc.transfer(user2Account, tenCoins, {from: creatorAccount})

    exchange = await SVCExchange.new(1, 'football', svc.address, {from: creatorAccount})

    // transfer assets to user2
    token1.transfer(user2Account, tenCoins, {from: creatorAccount})
    token2.transfer(user2Account, tenCoins, {from: creatorAccount})

    // transfer SVC and assets to exchange
    await svc.approve(exchange.address, tenCoins.mul(new BN(2)), {from: creatorAccount})
    await token1.approve(exchange.address, tenCoins, {from: creatorAccount})
    await token2.approve(exchange.address, tenCoins, {from: creatorAccount})
    await exchange.initToken(token1.address, tenCoins, tenCoins, {from: creatorAccount})
    await exchange.initToken(token2.address, tenCoins, tenCoins, {from: creatorAccount})
  }

  describe('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // first user1Account should approve the contract to spend its SVC
      await svc.approve(exchange.address, twoCoins, {from: user1Account})

      // then buy 1 player token
      await exchange.buy(token1.address, oneCoin, {from: user1Account})

      // we expect 1.12 SVC to be debited from user1 acc
      let coinBalance = await svc.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(88889).mul(new BN(10).pow(new BN(DECIMALS-4))))
      let assetBalance = await token1.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(oneCoin)
      assetBalance = await token2.balanceOf.call(user1Account)
      expect(assetBalance).to.eq.BN(0)

      // price should have increased
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(12345)
      price = await exchange.getAssetPrice.call(token2.address, 0, false)
      expect(price).to.eq.BN(10000)
    })

    it('price delta should depend on volume', async () => {
      // first user1Account should approve the contract to spend its SVC
      await svc.approve(exchange.address, tenCoins, {from: user1Account})

      // then buy 2 player1 tokens amd 1 player2 token
      await exchange.buy(token1.address, twoCoins, {from: user1Account})
      await exchange.buy(token2.address, oneCoin, {from: user1Account})

      // we expect 2.5 SVC to be added to token1 balance
      let coinBalance = await exchange.balanceOf.call(token1.address)
      expect(coinBalance).to.eq.BN(new BN(125000).mul(new BN(10).pow(new BN(DECIMALS-4))))
      // we expect 1.11 SVC to be added to token2 balance
      coinBalance = await exchange.balanceOf.call(token2.address)
      expect(coinBalance).to.eq.BN(new BN(111111).mul(new BN(10).pow(new BN(DECIMALS-4))))
      // check total SVC balance
      coinBalance = await svc.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(63889).mul(new BN(10).pow(new BN(DECIMALS-4))))

      // price should have increased more
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(15625)
      price = await exchange.getAssetPrice.call(token2.address, 0, true)
      expect(price).to.eq.BN(12345)
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend SVC
      let res = await svc.approve(exchange.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchange.buy(token1.address, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await svc.approve(exchange.address, hundredCoins, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchange.buy(token1.address, hundredCoins, {from: user1Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(exchange.buy(token1.address, oneCoin, {from: user1Account}))
    })
  })

  describe('Asset sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      await token1.approve(exchange.address, twoCoins, {from: user2Account})

      // then sell 1 token
      await exchange.sell(token1.address, oneCoin, {from: user2Account})

      // we expect 1 token to be sold for 1.09 SVC
      let coinBalance = await svc.balanceOf.call(user2Account)
      console.log('User2 SVC balance after sale: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(109090).mul(new BN(10).pow(new BN(DECIMALS - 4))))
      let assetBalance = await token1.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(tenCoins.sub(oneCoin))
      assetBalance = await token2.balanceOf.call(user2Account)
      expect(assetBalance).to.eq.BN(tenCoins)

      // price should have decreased
      let price = await exchange.getAssetPrice.call(token1.address, 0, false)
      expect(price).to.eq.BN(8264)
      price = await exchange.getAssetPrice.call(token2.address, 0, false)
      expect(price).to.eq.BN(10000)
    })

    it('price delta should depend on volume', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      await token1.approve(exchange.address, tenCoins, {from: user2Account})
      await token2.approve(exchange.address, tenCoins, {from: user2Account})

      // then sell 2 tokens
      await exchange.sell(token1.address, twoCoins, {from: user2Account})
      await exchange.sell(token2.address, oneCoin, {from: user2Account})

      // we expect 1.67 SVC to be removed from token1 balance
      let coinBalance = await exchange.balanceOf.call(token1.address)
      expect(coinBalance).to.eq.BN(new BN(83334).mul(new BN(10).pow(new BN(DECIMALS-4))))
      // we expect 0.91 SVC to be removed from token2 balance
      coinBalance = await exchange.balanceOf.call(token2.address)
      expect(coinBalance).to.eq.BN(new BN(90910).mul(new BN(10).pow(new BN(DECIMALS-4))))
      // check total SVC balance
      coinBalance = await svc.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(125756).mul(new BN(10).pow(new BN(DECIMALS - 4))))

      // price should have decreased
      let price = await exchange.getAssetPrice.call(token1.address, 0, false)
      expect(price).to.eq.BN(6944)
      price = await exchange.getAssetPrice.call(token2.address, 0, false)
      expect(price).to.eq.BN(8264)
    })

    it('should fail if seller has no tokens', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend player tokens
      let res = await token1.approve(exchange.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(exchange.sell(token1.address, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await token1.approve(exchange.address, oneCoin, {from: user1Account})
      assert.ok(res)
      await expectRevert(exchange.sell(token1.address, hundredCoins, {from: user1Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(exchange.sell(token1.address, oneCoin, {from: user2Account}))
    })

    // should not be able to have 0 assets
  })

  describe('addLiquidity', () => {
    beforeEach(init)

    it('should add liquidity to the exchange', async () => {
      // approve transfers
      await token1.approve(exchange.address, tenCoins, {from: creatorAccount})
      await svc.approve(exchange.address, tenCoins, {from: creatorAccount})

      await exchange.addLiquidity(token1.address, oneCoin, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await svc.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(new BN(21).mul(oneCoin))
      coinBalance = await exchange.balanceOf.call(token1.address)
      expect(coinBalance).to.eq.BN(oneCoin.mul(new BN(11)))
      let assetBalance = await token1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(new BN(11).mul(oneCoin))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should fail if not enough assets', async () => {
      // approve transfers
      await token1.approve(exchange.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})
      await svc.approve(exchange.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})

      // try to call addLiquidity
      await expectRevert(exchange.addLiquidity(token1.address, thousandCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should fail if asset not approved', async () => {
      // approve transfers
      res = await svc.approve(exchange.address, thousandCoins.mul(new BN(2)), {from: creatorAccount})
      assert.ok(res)

      // try to call addLiquidity
      await expectRevert(exchange.addLiquidity(token1.address, oneCoin, {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

  })

  describe('removeLiquidity', () => {
    beforeEach(init)

    it('should remove liquidity from the exchange', async () => {
      await exchange.removeLiquidity(token1.address, twoCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await svc.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(new BN(18).mul(oneCoin))
      coinBalance = await exchange.balanceOf.call(token1.address)
      expect(coinBalance).to.eq.BN(new BN(8).mul(oneCoin))
      let assetBalance = await token1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(new BN(8).mul(oneCoin))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

    it('should remove all coins from the exchange', async () => {
      await exchange.removeLiquidity(token1.address, tenCoins, {from: creatorAccount})

      // we expect 1 coin and 1 token to be transferred
      let coinBalance = await svc.balanceOf.call(exchange.address)
      expect(coinBalance).to.eq.BN(tenCoins)
      coinBalance = await exchange.balanceOf.call(token1.address)
      expect(coinBalance).to.eq.BN(0)
      let assetBalance = await token1.balanceOf.call(exchange.address)
      expect(assetBalance).to.eq.BN(0)
    })

    it('should fail if not enough assets', async () => {
      await expectRevert(exchange.removeLiquidity(token1.address, thousandCoins.mul(new BN(2)), {from: creatorAccount}))

      // price should not have changed
      let price = await exchange.getAssetPrice.call(token1.address, 0, true)
      expect(price).to.eq.BN(10000)
    })

  })
})
