const PlayerTokenContract = artifacts.require('tokens/PlayerToken.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const helpers = require('../helpers')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))

contract('PlayerTokenFactory', function (accounts) {
  let tokenFactory
  const creatorAccount = accounts[0]
  const DECIMALS = 18
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))
  const player_symbol = 'FLMS'

  console.log(`creatorAccount address: ${creatorAccount}`)

  let init = async () => {
    tokenFactory = await PlayerTokenFactory.new('Football tokens', 'football', {from: creatorAccount})
    console.log(`PlayerTokenFactory created at address: ${tokenFactory.address}`)
  }

  describe('createToken', () => {
    beforeEach(init)

    it('should create a new token', async () => {
      await tokenFactory.createToken(thousandCoins, 'Lionel Messi Token', player_symbol, {from: creatorAccount})
      let tokenAddr = await tokenFactory.tokenList.call(0)
      console.log(`Token ${player_symbol} created. Address: ${tokenAddr}`)
      let token = await PlayerTokenContract.at(tokenAddr)
      let tokenName = await token.name.call()
      expect(tokenName).to.equal('Lionel Messi Token')
      let balance = await token.balanceOf.call(creatorAccount)
      console.log(`creatorAccount balance in ${player_symbol}: ${helpers.toRealTokenNumber(balance)}`)
      balance = await token.balanceOf.call(tokenFactory.address)
      console.log(`tokenFactory.address balance in ${player_symbol}: ${balance}`)
      expect(balance).to.eq.BN(0)
      let id = await token.id.call()
      expect(id).to.eq.BN(1)
    })
  })
})
