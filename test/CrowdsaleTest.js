const SportTradeCoinAbstraction = artifacts.require('SportTradeCoin')
const CrowdsaleAbstraction = artifacts.require('Crowdsale')
const BigNumber = require('bignumber.js')
const expect = require('chai').expect

contract('Crowdsale', function (accounts) {
  let tokenContract
  let crowdsaleContract
  const decimals = 18
  const initialAmount = new BigNumber(100).times(new BigNumber(10).pow(6 + decimals))
  const crowdsaleAmount = new BigNumber(12).times(new BigNumber(10).pow(6 + decimals))
  const weiPerToken = 500000000
  const creatorAccount = accounts[0]
  const fundsAccount = accounts[1]
  const userAccount = accounts[2]

  let init = async () => {
    tokenContract = await SportTradeCoinAbstraction.new()
    crowdsaleContract = await CrowdsaleAbstraction.new(tokenContract.address, fundsAccount)
    // transfer tokens from owner to crowd sale contract
    await tokenContract.transfer(crowdsaleContract.address, crowdsaleAmount)
  }

  describe('default function', () => {
    beforeEach(init)

    it('should sell tokens to eth sender', async () => {
      let initialFundsBalance = await web3.eth.getBalance(fundsAccount)
      console.log('initialFundsBalance', initialFundsBalance)
      // when user sends 1 eth to preICOCOntract
      await web3.eth.sendTransaction({
        from: userAccount,
        to: crowdsaleContract.address,
        value: web3.toWei('1', 'Ether')
      })

      let ownerBalance = await tokenContract.balanceOf.call(creatorAccount)
      console.log('Owner Balance', ownerBalance)
      let userTokenBalance = await tokenContract.balanceOf.call(userAccount)
      console.log('User Balance', userTokenBalance)
      expect(userTokenBalance.toNumber()).to.equal(web3.toWei('1', 'Ether') / weiPerToken)

      // check that funds have been transferred to fundsAccount
      let fundsAccountBalance = await web3.eth.getBalance(fundsAccount)
      console.log('fundsAccountBalance', fundsAccountBalance)
      expect(fundsAccountBalance.minus(initialFundsBalance).dividedBy(web3.toWei('1', 'Ether')).toNumber()).to.equal(1)
    })
  })

  describe('withdrawTokens', () => {
    beforeEach(init)

    it('should enable owner to withdraw all remaining tokens and disable sale', async () => {
      let contractBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(contractBalance.toNumber()).to.equal(crowdsaleAmount.toNumber())
      await crowdsaleContract.withdrawTokens(creatorAccount)
      let ownerBalance = await tokenContract.balanceOf.call(creatorAccount)
      expect(ownerBalance.toNumber()).to.equal(initialAmount.toNumber())
      contractBalance = await tokenContract.balanceOf.call(crowdsaleContract.address)
      expect(contractBalance.toNumber()).to.equal(0)
      let isEnded = await crowdsaleContract.ended.call()
      expect(isEnded).to.equal(true)

      // it should not be possible to buy again
      try {
        await web3.eth.sendTransaction({
          from: userAccount,
          to: crowdsaleContract.address,
          value: web3.toWei('1', 'Ether')
        })
        throw new Error('Transfer should fail')
      } catch (e) {
        assert.ok(e)
        let userBalance = await tokenContract.balanceOf.call(userAccount)
        expect(userBalance.toNumber()).to.equal(0)
      }
    })

    it('should not allow non owner to withdraw tokens', async () => {
      try {
        await crowdsaleContract.withdrawTokens(userAccount, {from: userAccount})
        throw new Error('withdrawTokens should fail')
      } catch (e) {
        assert.ok(e)
      }
    })
  })
})
