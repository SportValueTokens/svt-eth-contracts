const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const LiquidityContract = artifacts.require('./SVCLiquidityProvider.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
const expectRevert = require('./helpers').expectRevert

contract('SVCLiquidityProvider', function (accounts) {
  let coinContract
  let playerTokenContract
  let liquidityContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const DECIMALS = 18
  const oneCoin = new BigNumber(1).times(new BigNumber(10).pow(DECIMALS))
  const twoCoins = new BigNumber(2).times(new BigNumber(10).pow(DECIMALS))
  const tenCoins = new BigNumber(10).times(new BigNumber(10).pow(DECIMALS))
  const hundredCoins = new BigNumber(100).times(new BigNumber(10).pow(DECIMALS))
  const thousandCoins = new BigNumber(1000).times(new BigNumber(10).pow(DECIMALS))
  const initialPrice = new BigNumber(10).pow(4) // price is 1 SVC
  const player_id = 134820
  const player_symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(thousandCoins, 'Lionel Messi Token', player_symbol, player_id, 'football', {from: creatorAccount})
    // give each user 10 SVC
    await coinContract.transfer(user1Account, tenCoins, {from: creatorAccount})
    await coinContract.transfer(user2Account, tenCoins, {from: creatorAccount})

    liquidityContract = await LiquidityContract.new('football', coinContract.address, {from: creatorAccount})
    await liquidityContract.addAssetToMarket(playerTokenContract.address, initialPrice, {from: creatorAccount})

    // transfer assets to user2
    playerTokenContract.transfer(user2Account, twoCoins)

    // transfer SVC to liquidity contract
    await coinContract.transfer(liquidityContract.address, tenCoins, {from: creatorAccount})

    // transfer assets to contract
    await playerTokenContract.transfer(liquidityContract.address, tenCoins, {from: creatorAccount})
  }

  describe('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // first user1Account should approve the contract to spend its SVC
      let res = await coinContract.approve(liquidityContract.address, twoCoins, {from: user1Account})
      assert.ok(res)
      // then buy 1 player token
      await liquidityContract.buy(player_id, oneCoin, {from: user1Account})
      // we expect 1 token bought 1.00 SVC to be debited from user1 acc
      coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(new BigNumber(9).times(new BigNumber(10).pow(DECIMALS)))
      let tokenBalance = await playerTokenContract.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(oneCoin)

      // price should have increased
      let price = await liquidityContract.getAssetPrice.call(player_id)
      expect(price).bignumber.to.equal(10100)
    })

    it('should fail if buyer has no money', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend SVC
      let res = await coinContract.approve(liquidityContract.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(liquidityContract.buy(player_id, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await coinContract.approve(liquidityContract.address, hundredCoins, {from: user1Account})
      assert.ok(res)
      await expectRevert(liquidityContract.buy(player_id, hundredCoins, {from: user1Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(liquidityContract.buy(player_id, oneCoin, {from: user1Account}))
    })

  })

  describe('Asset sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // user2 needs to allow the liquidity contract to spend his tokens
      let res = await playerTokenContract.approve(liquidityContract.address, twoCoins, {from: user2Account})
      assert.ok(res)
      // then sell 1 token
      await liquidityContract.sell(player_id, oneCoin, {from: user2Account})
      // we expect 1 token to be sold for 0.99 SVC
      let coinBalance = await coinContract.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(new BigNumber(1100).times(new BigNumber(10).pow(DECIMALS - 2)))
      tokenBalance = await playerTokenContract.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(oneCoin)

      // price should have decreased
      let price = await liquidityContract.getAssetPrice.call(player_id)
      expect(price).bignumber.to.equal(9900)
    })

    it('should fail if seller has no tokens', async () => {
      const user3Account = accounts[3]
      // user3 approves the contract to spend player tokens
      let res = await playerTokenContract.approve(liquidityContract.address, oneCoin, {from: user3Account})
      assert.ok(res)
      await expectRevert(liquidityContract.sell(player_id, oneCoin, {from: user3Account}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      let res = await playerTokenContract.approve(liquidityContract.address, oneCoin, {from: user1Account})
      assert.ok(res)
      await expectRevert(liquidityContract.sell(player_id, hundredCoins, {from: user1Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(liquidityContract.sell(player_id, oneCoin, {from: user2Account}))
    })

  })

  // TODO update price, remove asset

})
