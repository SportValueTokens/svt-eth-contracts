const PlayerTokenContract = artifacts.require('./tokens/PlayerToken.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect

contract('PlayerTokenFactory', function (accounts) {
  let tokenFactory
  const creatorAccount = accounts[0]
  const DECIMALS = 18
  const thousandCoins = new BigNumber(1000).times(new BigNumber(10).pow(DECIMALS))
  const player_id = 134820
  const player_symbol = 'FLMS'

  let init = async () => {
    tokenFactory = await PlayerTokenFactory.new("Football tokens","Football", {from: creatorAccount})
  }

  describe('createToken', () => {
    beforeEach(init)

    it('should create a new token', async () => {
      await tokenFactory.createToken(thousandCoins, 'Lionel Messi Token', player_symbol, player_id, {from: creatorAccount})
      let tokenAddr = await tokenFactory.tokenList.call(0)
      let token = PlayerTokenContract.at(tokenAddr)
      let tokenName = await token.name.call()
      expect(tokenName).to.equal('Lionel Messi Token')
      let balance = await token.balanceOf.call(creatorAccount)
      console.log('creatorAccount balance',balance.toString())
      balance = await token.balanceOf.call(tokenFactory.address)
      console.log('tokenFactory.address balance',balance.toString())
    })
  })
})
