const SVCoinContract = artifacts.require('SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('PlayerToken.sol')
const LiquidityContract = artifacts.require('LiquidityProvider.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
// const expectRevert = require('./helpers').expectRevert

contract('LiquidityProvider', function (accounts) {
  let coinContract
  let playerTokenContract
  let liquidityContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const decimals = 18
  const initialAmountAssets = new BigNumber(10).pow(decimals)
  const oneCoin = new BigNumber(1).times(new BigNumber(10).pow(decimals))
  const initialPrice = new BigNumber(10).pow(4) // price is 1 SVC
  const id = 134820
  const symbol = 'FLMS'

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    playerTokenContract = await PlayerTokenContract.new(initialAmountAssets, 'Lionel Messi Token', symbol, id, {from: creatorAccount})
    // give each user 1000 SVC
    await coinContract.transfer(user1Account, oneCoin, {from: creatorAccount})
    await coinContract.transfer(user2Account, oneCoin, {from: creatorAccount})

    liquidityContract = await LiquidityContract.new(coinContract.address, {from: creatorAccount})
    await liquidityContract.addAssetToMarket(playerTokenContract.address, initialPrice, {from: creatorAccount})

    // transfer all assets to liquidity contract
    playerTokenContract.transfer(liquidityContract.address, initialAmountAssets)
  }

  describe.only('Asset purchase', () => {
    beforeEach(init)

    it('a user should be able to buy an asset with SVC', async () => {
      // check if user1 has money
      let coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 initial SVC balance: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(oneCoin)

      // first user1Account should authorise the contract
      let res = await coinContract.approve(liquidityContract.address, oneCoin, {from: user1Account})
      assert.ok(res)
      // then buy 1 token
      await liquidityContract.buy(id, 1, {from: user1Account})
      // we expect 1 token to bought 1 SVC to be debited from user1 acc
      coinBalance = await coinContract.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).bignumber.to.equal(oneCoin.minus(1))
      let tokenBalance = await playerTokenContract.balanceOf.call(user1Account)
      console.log('User1 Asset balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).bignumber.to.equal(new BigNumber(1).pow(decimals))
    })
  })
})
