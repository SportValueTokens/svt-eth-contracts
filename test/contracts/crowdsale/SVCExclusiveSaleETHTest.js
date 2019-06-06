const SVCContract = artifacts.require('tokens/SportValueCoin.sol')
const SVCExclusiveSaleETHContract = artifacts.require('crowdsale/SVCExclusiveSaleETH.sol')
const BigNumber = require('bignumber.js')
const chai = require('chai')
chai.use(require('chai-bignumber')(BigNumber))
const expect = chai.expect
const expectRevert = require('../helpers').expectRevert

contract('SVCExclusiveSaleETH', function (accounts) {
  let tokenContract
  let crowdsaleContract
  const creatorAccount = accounts[0]
  const fundsAccount = accounts[1]
  const userAccount = accounts[2]
  const DECIMALS = 18
  const HARD_CAP_ETH = 2000
  const TOKENS_PER_WEI = 300
  const TOKENS_PER_ETH = new BigNumber(TOKENS_PER_WEI).times(new BigNumber(10).pow(DECIMALS))
  const totalNumberOfTokens = new BigNumber(100).times(new BigNumber(10).pow(6 + DECIMALS))
  const tokensForSale = new BigNumber(HARD_CAP_ETH).times(TOKENS_PER_ETH)

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
      console.log('Initial funds Eth balance', web3.fromWei(initialFundsEth).toString())
      let initialUserEthBalance = await web3.eth.getBalance(userAccount)
      console.log('Initial user Eth balance', web3.fromWei(initialUserEthBalance).toString())
      let ownerTokenBalance = await tokenContract.balanceOf.call(creatorAccount)
      console.log('Owner token balance', ownerTokenBalance.toNumber())
      let crowdsaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      console.log('Crowdsale contract token balance', crowdsaleTokenBalance.toNumber())

      // when user sends 1 eth to crowd sale contract
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(1, 'ether')})
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      console.log('User Token Balance', userTokenBalance.toNumber())
      const expectedTokenBalance = TOKENS_PER_ETH
      expect(userTokenBalance).to.bignumber.equal(expectedTokenBalance)
      crowdsaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      console.log('Crowdsale contract token balance after transfer', crowdsaleTokenBalance.toNumber())

      // check that funds have been transferred
      let fundsEth = await web3.eth.getBalance(fundsAccount)
      console.log('Owner Balance After sale', web3.fromWei(fundsEth).toString())
      expect(web3.fromWei(fundsEth.minus(initialFundsEth))).to.bignumber.be.greaterThan(0.9)
    })

    it('Sender needs to send eth', async () => {
      // when user sends 0 eth to EvedoTokenSale contract
      await expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(0, 'ether')}))
    })

    it(`Sender should not be able to buy tokens if eth > HARD_CAP`, async () => {
      // when user sends 2500 eth to the crowd sale contract
      await expectRevert(crowdsaleContract.sendTransaction({
        from: userAccount,
        value: web3.toWei(HARD_CAP_ETH + 1, 'ether')
      }))
    })

    it(`Sender should be able to send HARD_CAP eth max`, async () => {
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(HARD_CAP_ETH, 'ether')})
      await expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(10, 'ether')}))
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      console.log('User Token Balance', userTokenBalance.toNumber())
      const expectedTokenBalance = new BigNumber(HARD_CAP_ETH).times(TOKENS_PER_ETH)
      expect(userTokenBalance).to.bignumber.equal(expectedTokenBalance)
    })
  })

  describe('Open/Close', () => {
    beforeEach(init)

    it('when closed no sale is possible', async () => {
      await crowdsaleContract.close()
      await expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(1, 'ether')}))
    })

    it('Only owner can open/close', async () => {
      await expectRevert(crowdsaleContract.open({from: userAccount}))
      await expectRevert(crowdsaleContract.close({from: userAccount}))
    })
  })

  describe('price update', () => {
    beforeEach(init)

    it('only owner can update price', async () => {
      await expectRevert(crowdsaleContract.setRate(1,{from: userAccount}))
    })

    it('only owner can update price', async () => {
      // change price
      await crowdsaleContract.setRate(500,{from: creatorAccount})

      // check price changed
      let rate = await crowdsaleContract.rate.call({from: userAccount})
      expect(rate).bignumber.to.equal(new BigNumber(500))

      // buy tokens with new price
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(1, 'ether')})
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      const expectedTokenBalance = new BigNumber(500).times(TOKENS_PER_ETH)
    })
  })

  describe('Finalise', () => {
    beforeEach(init)

    it('when finalised no sale is possible and unsold tokens are returned to owner', async () => {
      // send 1000 eth
      await crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(1000, 'ether')})
      let crowdSaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(crowdSaleTokenBalance).bignumber.to.equal(new BigNumber(1000).times(TOKENS_PER_ETH))
      await crowdsaleContract.finalize()
      // try to buy more
      await expectRevert(crowdsaleContract.sendTransaction({from: userAccount, value: web3.toWei(1, 'ether')}))
      crowdSaleTokenBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(crowdSaleTokenBalance).bignumber.to.equal(0)
      let ownerTokenBalance = await tokenContract.balanceOf.call(creatorAccount)
      expect(ownerTokenBalance).bignumber.to.equal(totalNumberOfTokens.minus(new BigNumber(1000).times(TOKENS_PER_ETH)))
    })

    it('Only owner can finalise', async () => {
      await expectRevert(crowdsaleContract.finalize({from: userAccount}))
    })
  })
})
