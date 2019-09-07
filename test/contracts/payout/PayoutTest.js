const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const PayoutContract = artifacts.require('payout/Payout.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const helpers = require('../helpers')

contract('Payout', function (accounts) {
  let coinContract
  let player1TokenContract
  let player2TokenContract
  let player3TokenContract
  let payoutContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const payoutAccount = accounts[3]
  const DECIMALS = 18
  const oneCoin = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const twoCoins = new BN(2).mul(new BN(10).pow(new BN(DECIMALS)))
  const tenCoins = new BN(10).mul(new BN(10).pow(new BN(DECIMALS)))
  const hundredCoins = new BN(100).mul(new BN(10).pow(new BN(DECIMALS)))
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))

  let init = async () => {
    coinContract = await SVCoinContract.new({from: creatorAccount})
    player1TokenContract = await PlayerTokenContract.new(thousandCoins, 1, 'LMS', 'Lionel Messi Token', 'football', {from: creatorAccount})
    player2TokenContract = await PlayerTokenContract.new(thousandCoins, 2, 'NMR', 'Neymar Token', 'football', {from: creatorAccount})
    player3TokenContract = await PlayerTokenContract.new(thousandCoins, 3, 'PGB', 'Pogba Token', 'football', {from: creatorAccount})

    payoutContract = await PayoutContract.new(1, 'football', coinContract.address, payoutAccount, {from: creatorAccount})

    // transfer assets to users
    player3TokenContract.transfer(user1Account, twoCoins)
    player1TokenContract.transfer(user2Account, oneCoin)
    player2TokenContract.transfer(user2Account, oneCoin)
    player3TokenContract.transfer(user2Account, oneCoin)

    // transfer SVC to payout account and approve contract to be able to pay with it
    await coinContract.transfer(payoutAccount, hundredCoins, {from: creatorAccount})
    await coinContract.approve(payoutContract.address, hundredCoins, {from: payoutAccount})
  }

  describe('updateWinners', () => {
    beforeEach(init)

    it('should update winners', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)
      let win = await payoutContract.wins.call(0, {from: user1Account})
      console.log('token1 win: ', JSON.stringify(win))
      expect(win['amount']).to.eq.BN(twoCoins)
      expect(win['token']).to.equal(player1TokenContract.address)
      win = await payoutContract.wins.call(1, {from: user1Account})
      console.log('token2 win: ', JSON.stringify(win))
      expect(win['amount']).to.eq.BN(oneCoin)
      expect(win['token']).to.equal(player2TokenContract.address)
    })

    it('only owner should update winners', async () => {
      await helpers.expectRevert(payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: user1Account}))
    })

    it('should remove old data', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)
      res = await payoutContract.updateWinners([player2TokenContract.address, player3TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)

      let win = await payoutContract.wins.call(0, {from: user1Account})
      console.log('token1 win: ', JSON.stringify(win))
      expect(win['amount']).to.eq.BN(twoCoins)
      expect(win['token']).to.equal(player2TokenContract.address)
      win = await payoutContract.wins.call(1, {from: user1Account})
      console.log('token2 win: ', JSON.stringify(win))
      expect(win['amount']).to.eq.BN(oneCoin)
      expect(win['token']).to.equal(player3TokenContract.address)
    })
  })

  describe('calcPayout', () => {
    beforeEach(init)

    it('should calculate payouts winners', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)

      let payout = await payoutContract.calcPayout(player1TokenContract.address, user1Account, {from: user1Account})
      console.log('user1 payout for player1: ', payout)
      expect(payout).to.eq.BN(0)
      payout = await payoutContract.calcPayout(player1TokenContract.address, user2Account, {from: user2Account})
      console.log('user2 payout for player1: ', payout)
      expect(payout).to.eq.BN(twoCoins.div(new BN(1000)))
      payout = await payoutContract.calcPayout(player2TokenContract.address, user2Account, {from: user2Account})
      console.log('user2 payout for player2: ', payout)
      expect(payout).to.eq.BN(oneCoin.div(new BN(1000)))
    })
  })

  describe('getPayment', () => {
    beforeEach(init)

    it('should pay payout to user who has winning tokens', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)

      await payoutContract.getPayment([player1TokenContract.address, player2TokenContract.address], {from: user2Account})

      let balance = await coinContract.balanceOf.call(user2Account)

      console.log('user1 SVC balance:', balance)
      expect(balance).to.eq.BN(oneCoin.add(twoCoins).div(new BN(1000)))
    })

    it('should not pay payout to user for non winning tokens', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)

      await payoutContract.getPayment([player1TokenContract.address], {from: user2Account})

      let balance = await coinContract.balanceOf.call(user2Account)

      console.log('user1 SVC balance:', balance)
      expect(balance).to.eq.BN(twoCoins.div(new BN(1000)))
    })

    it('should not pay payout to user fot tokens he does not own', async () => {
      let res = await payoutContract.updateWinners([player1TokenContract.address, player2TokenContract.address], [twoCoins, oneCoin], {from: creatorAccount})
      assert.ok(res)

      await payoutContract.getPayment([player1TokenContract.address, player2TokenContract.address], {from: user1Account})

      let balance = await coinContract.balanceOf.call(user1Account)

      console.log('user1 SVC balance:', balance)
      expect(balance).to.eq.BN(0)
    })

  })

})
