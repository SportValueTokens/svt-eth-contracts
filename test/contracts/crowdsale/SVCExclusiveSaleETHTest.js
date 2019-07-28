const SVCContract = artifacts.require('tokens/SportValueCoin.sol')
const SVCExclusiveSaleETHContract = artifacts.require('crowdsale/SVCExclusiveSaleETH.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const helpers = require('../helpers')

contract('SVCExclusiveSaleETH', function (accounts) {
  let tokenContract
  let crowdsaleContract
  const creatorAccount = accounts[0]
  const fundsAccount = accounts[1]
  const userAccount = accounts[2]
  const DECIMALS = 18
  const HARD_CAP_ETH = 2000
  const TOKENS_PER_WEI = new BN(300)
  const TOKENS_PER_ETH = new BN(TOKENS_PER_WEI).mul(new BN(10).pow(new BN(DECIMALS)))
  const totalNumberOfTokens = new BN(100).mul(new BN(10).pow(new BN(6 + DECIMALS)))
  const tokensForSale = new BN(HARD_CAP_ETH).mul(TOKENS_PER_ETH)

  let init = async () => {
    tokenContract = await SVCContract.new()
    crowdsaleContract = await SVCExclusiveSaleETHContract.new(TOKENS_PER_WEI, fundsAccount, tokenContract.address)
    // the contract needs to own the takens for sale
    tokenContract.transfer(crowdsaleContract.address, tokensForSale)
  }

  describe('Token sale', () => {
    beforeEach(init)

    it('Sender should be able to buy tokens', async () => {
      let initialFundsEth = await web3.eth.getBalance(fundsAccount)
      console.log('Initial funds Eth balance', web3.utils.fromWei(initialFundsEth).toString())
      let initialUserEthBalance = await web3.eth.getBalance(userAccount)
      console.log('Initial user Eth balance', web3.utils.fromWei(initialUserEthBalance).toString())
      let ownerTokenBalance = await tokenContract.balanceOf.call(creatorAccount)
      console.log('Owner token balance', helpers.toRealTokenNumber(ownerTokenBalance).toString())
      let crowdsaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      console.log('Crowdsale contract token balance', helpers.toRealTokenNumber(crowdsaleTokenBalance).toString())

      // when user sends 1 eth to crowd sale contract
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('1', 'ether')})
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      console.log('User Token Balance', helpers.toRealTokenNumber(userTokenBalance).toString())
      const expectedTokenBalance = TOKENS_PER_ETH
      expect(userTokenBalance).to.eq.BN(expectedTokenBalance)
      crowdsaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      console.log('Crowdsale contract token balance after transfer', helpers.toRealTokenNumber(crowdsaleTokenBalance).toString())

      // check that funds have been transferred
      let fundsEth = await web3.eth.getBalance(fundsAccount)
      console.log('Owner Balance After sale (ETH)', web3.utils.fromWei(fundsEth))
      expect(new BN(fundsEth).sub(new BN(initialFundsEth))).to.be.gte.BN(web3.utils.toWei('1'))
    })

    it('Sender needs to send eth', async () => {
      // when user sends 0 eth to EvedoTokenSale contract
      await helpers.expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('0', 'ether')}),'weiAmount is 0')
    })

    it(`Sender should not be able to buy tokens if eth > HARD_CAP`, async () => {
      // when user sends 2500 eth to the crowd sale contract
      await helpers.expectRevert(crowdsaleContract.sendTransaction({
        from: userAccount,
        value: web3.utils.toWei(new BN(HARD_CAP_ETH + 1), 'ether')
      }))
    })

    it(`Sender should be able to send HARD_CAP eth max`, async () => {
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei(new BN(HARD_CAP_ETH), 'ether')})
      await helpers.expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('10', 'ether')}),'Sale Cap reached')
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      console.log('User Token Balance', helpers.toRealTokenNumber(userTokenBalance))
      const expectedTokenBalance = new BN(HARD_CAP_ETH).mul(TOKENS_PER_ETH)
      expect(userTokenBalance).to.eq.BN(expectedTokenBalance)
    })
  })

  describe('Open/Close', () => {
    beforeEach(init)

    it('when closed no sale is possible', async () => {
      await crowdsaleContract.close()
      await helpers.expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('1', 'ether')}))
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
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('1', 'ether')})
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      const expectedTokenBalance = new BN(500).mul(TOKENS_PER_ETH)
    })
  })

  describe('Finalise', () => {
    beforeEach(init)

    it('when finalised no sale is possible and unsold tokens are returned to owner', async () => {
      // send 1000 eth
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('1000', 'ether')})
      let crowdSaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(crowdSaleTokenBalance).to.eq.BN(new BN(1000).mul(TOKENS_PER_ETH))
      await crowdsaleContract.finalize()
      // try to buy more
      await helpers.expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.utils.toWei('1', 'ether')}))
      crowdSaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(crowdSaleTokenBalance).to.eq.BN(0)
      let ownerTokenBalance = await tokenContract.balanceOf.call(creatorAccount)
      expect(ownerTokenBalance).to.eq.BN(totalNumberOfTokens.sub(new BN(1000).mul(TOKENS_PER_ETH)))
    })

    it('Only owner can finalise', async () => {
      await helpers.expectRevert(crowdsaleContract.finalize({from: userAccount}))
    })
  })
})
