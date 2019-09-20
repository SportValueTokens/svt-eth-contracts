const SVCContract = artifacts.require('tokens/SportValueCoin.sol')
const MintableToken = artifacts.require('tokens/MintableToken.sol')
const SVCExclusiveSaleERC20Contract = artifacts.require('crowdsale/SVCExclusiveSaleERC20.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const helpers = require('../helpers')

contract('SVCExclusiveSaleERC20', function (accounts) {
  let svc
  let erc20
  let crowdsaleContract
  const creatorAccount = accounts[0]
  const fundsAccount = accounts[1]
  const userAccount = accounts[2]
  const DECIMALS = 18
  const totalNumberOfTokens = new BN(100).mul(new BN(10).pow(new BN(6 + DECIMALS)))
  const oneToken = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const thousandTokens = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))
  const HARD_CAP = new BN(2000000).mul(new BN(10).pow(new BN(DECIMALS)))

  let init = async () => {
    svc = await SVCContract.new()
    erc20 = await MintableToken.new()
    await erc20.mint(userAccount, thousandTokens)
    crowdsaleContract = await SVCExclusiveSaleERC20Contract.new(10000, fundsAccount, erc20.address, svc.address, 'TST')
    // the contract needs to own the tokens for sale
    await svc.transfer(crowdsaleContract.address, HARD_CAP.mul(new BN(2)))
    await erc20.approve(crowdsaleContract.address, thousandTokens, {from: userAccount})
    let crowdsaleSVCBalance = await svc.balanceOf.call(crowdsaleContract.address)
    console.log('SVCExclusiveSaleERC20 initial SVC balance', helpers.toRealTokenNumber(crowdsaleSVCBalance).toString())
  }

  describe('Token sale', () => {
    beforeEach(init)

    it('Sender should be able to buy SVC tokens', async () => {
      // when user sends 1 ERC20 token to crowd sale contract
      await crowdsaleContract.buyTokens(oneToken, {from: userAccount})
      let userSVCBalance = await svc.balanceOf.call(userAccount)
      console.log('User SVC Balance after purchase', helpers.toRealTokenNumber(userSVCBalance).toString())
      expect(userSVCBalance).to.eq.BN(oneToken)

      let crowdsaleTokenBalance = await erc20.balanceOf.call(fundsAccount)
      console.log('Funds Account token balance after transfer', helpers.toRealTokenNumber(crowdsaleTokenBalance).toString())
      let crowdsaleSVCBalance = await svc.balanceOf.call(crowdsaleContract.address)
      console.log('SVCExclusiveSaleERC20 contract SVC balance after transfer', helpers.toRealTokenNumber(crowdsaleSVCBalance).toString())
      expect(crowdsaleSVCBalance).to.eq.BN(HARD_CAP.mul(new BN(2)).sub(oneToken))
    })

    it('Sender should get 0 tokens if he wants 0 tokens', async () => {
      // when user sends 0 ERC20 token to crowd sale contract
      await crowdsaleContract.buyTokens(0, {from: userAccount})
      let userTokenBalance = await svc.balanceOf.call(userAccount)
      expect(userTokenBalance).to.eq.BN(0)
      let crowdsaleSVCBalance = await svc.balanceOf.call(crowdsaleContract.address)
      expect(crowdsaleSVCBalance).to.eq.BN(HARD_CAP.mul(new BN(2)))
    })

    it(`Sender should not be able to buy tokens if eth > HARD_CAP`, async () => {
      await helpers.expectRevert(crowdsaleContract.buyTokens(HARD_CAP.add(new BN(1)), {from: userAccount}))
    })
  })

  describe('Open/Close', () => {
    beforeEach(init)

    it('when closed no sale is possible', async () => {
      await crowdsaleContract.close()
      await helpers.expectRevert(crowdsaleContract.buyTokens(oneToken, {from: userAccount}))
    })

    it('Only owner can open/close', async () => {
      await helpers.expectRevert(crowdsaleContract.open({from: userAccount}))
      await helpers.expectRevert(crowdsaleContract.close({from: userAccount}))
    })
  })

  describe('price update', () => {
    beforeEach(init)

    it('only owner can update price', async () => {
      await helpers.expectRevert(crowdsaleContract.setRate(1, {from: userAccount}))
    })

    it('only owner can update price', async () => {
      // change price
      await crowdsaleContract.setRate(500, {from: creatorAccount})

      // check price changed
      let rate = await crowdsaleContract.rate.call({from: userAccount})
      expect(rate).to.eq.BN(500)

      // buy tokens with new price
      await crowdsaleContract.buyTokens(oneToken, {from: userAccount})
      let userTokenBalance = await svc.balanceOf.call(userAccount)
      const expectedTokenBalance = new BN(500).mul(oneToken)
    })
  })

  describe('Finalise', () => {
    beforeEach(init)

    it('when finalised no sale is possible and unsold tokens are returned to owner', async () => {
      await crowdsaleContract.buyTokens(oneToken, {from: userAccount})
      let userSVCBalance = await svc.balanceOf.call(userAccount)
      expect(userSVCBalance).to.eq.BN(oneToken)
      await crowdsaleContract.finalize({from: creatorAccount})
      // try to buy more
      await helpers.expectRevert(crowdsaleContract.buyTokens(oneToken, {from: userAccount}))
      userSVCBalance = await svc.balanceOf.call(userAccount)
      expect(userSVCBalance).to.eq.BN(oneToken)
      let ownerTokenBalance = await svc.balanceOf.call(creatorAccount)
      expect(ownerTokenBalance).to.eq.BN(totalNumberOfTokens.sub(oneToken))
    })

    it('Only owner can finalise', async () => {
      await helpers.expectRevert(crowdsaleContract.finalize({from: userAccount}))
    })
  })
})
