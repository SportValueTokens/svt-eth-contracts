const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const PlayerRankContract = artifacts.require('payout/PlayerRank.sol')
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
  let playerRankContract
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
    player1TokenContract = await PlayerTokenContract.new(thousandCoins, 1, 'LMS', 'Lionel Messi Token', 'football', {from: creatorAccount})
    player2TokenContract = await PlayerTokenContract.new(thousandCoins, 2, 'NMR', 'Neymar Token', 'football', {from: creatorAccount})
    player3TokenContract = await PlayerTokenContract.new(thousandCoins, 3, 'PGB', 'Pogba Token', 'football', {from: creatorAccount})

    playerRankContract = await PlayerRankContract.new(1, 'football', coinContract.address, {from: creatorAccount})

    // transfer SVC to payout contract to be able to pay with it
    await coinContract.transfer(playerRankContract.address, hundredCoins, {from: creatorAccount})
  }

  describe('update', () => {
    beforeEach(init)

    it('should update ranks', async () => {
      const tokens = [player1TokenContract.address, player2TokenContract.address, player3TokenContract.address]
      const ranks = [3, 2, 1]
      const scores = [30, 20, -5]
      await playerRankContract.update(tokens, scores, ranks, {from: creatorAccount})

      const player1Score = await playerRankContract.scores.call(player1TokenContract.address, {from: user1Account})
      expect(player1Score).to.eq.BN(30)
      const player1Rank = await playerRankContract.ranks.call(player1TokenContract.address, {from: user1Account})
      expect(player1Rank).to.eq.BN(3)
    })

    it('only owner should update winners', async () => {
      const tokens = [player1TokenContract.address, player2TokenContract.address, player3TokenContract.address]
      const ranks = [3, 2, 1]
      const scores = [30, 20, -5]
      await helpers.expectRevert(playerRankContract.update(tokens, scores, ranks, {from: user1Account}))
    })
  })

})
