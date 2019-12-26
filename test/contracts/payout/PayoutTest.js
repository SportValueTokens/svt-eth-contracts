const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PayoutContract = artifacts.require('payout/Payout.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const helpers = require('../helpers')

contract('Payout', function (accounts) {
  let coinContract
  let payoutContract
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
    coinContract = await SVCoinContract.new({from: creatorAccount})
    payoutContract = await PayoutContract.new(coinContract.address, {from: creatorAccount})
    // transfer SVC to payout contract to be able to pay with it
    await coinContract.transfer(payoutContract.address, hundredCoins, {from: creatorAccount})
  }

  describe('getPayment', () => {
    beforeEach(init)

    it('a user should be able to get its payout', async () => {
      await payoutContract.setAmountOwedTo(user1Account, twoCoins, {from: creatorAccount})
      let amountOwed = await payoutContract.getAmountOwed({from: user1Account})
      expect(amountOwed).to.eq.BN(twoCoins)

      await payoutContract.getMyPayout({from: user1Account})

      let balance = await coinContract.balanceOf.call(user1Account)
      expect(balance).to.eq.BN(twoCoins)

      amountOwed = await payoutContract.getAmountOwed({from: user1Account})
      expect(amountOwed).to.eq.BN(0)
    })

    it('only owner can update payment owed', async () => {
      await helpers.expectRevert(payoutContract.setAmountOwedTo(user1Account, twoCoins, {from: user1Account}))
    })
  })

  describe('sendPayoutTo', () => {
    beforeEach(init)

    it('a user should be able to get its payout', async () => {
      await payoutContract.setAmountOwedTo(user1Account, twoCoins, {from: creatorAccount})
      let amountOwed = await payoutContract.getAmountOwed({from: user1Account})
      expect(amountOwed).to.eq.BN(twoCoins)

      await payoutContract.sendPayoutTo(user1Account, {from: creatorAccount})

      let balance = await coinContract.balanceOf.call(user1Account)
      expect(balance).to.eq.BN(twoCoins)

      amountOwed = await payoutContract.getAmountOwed({from: user1Account})
      expect(amountOwed).to.eq.BN(0)
    })

    it('only owner can call sendPaymentTo', async () => {
      await payoutContract.setAmountOwedTo(user1Account, twoCoins, {from: creatorAccount})
      await helpers.expectRevert(payoutContract.sendPayoutTo(user1Account, {from: user1Account}))
    })

  })
})
