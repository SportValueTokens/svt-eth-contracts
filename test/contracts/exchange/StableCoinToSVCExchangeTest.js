const SVCoinContract = artifacts.require('./tokens/SportValueCoin.sol')
const MintableToken = artifacts.require('tokens/MintableToken.sol')
const StableCoinToSVCExchange = artifacts.require('exchange/StableCoinToSVCExchange.sol')
const chai = require('chai')
const expect = chai.expect
const BN = require('bn.js')
const bnChai = require('bn-chai')
chai.use(bnChai(BN))
const helpers = require('../helpers')
const expectRevert = helpers.expectRevert

contract('StableCoinToSVCExchange', function (accounts) {
  let svc
  let erc20
  let exchangeContract
  const creatorAccount = accounts[0]
  const user1Account = accounts[1]
  const user2Account = accounts[2]
  const user3Account = accounts[3]
  const DECIMALS = 18
  const oneCoin = new BN(1).mul(new BN(10).pow(new BN(DECIMALS)))
  const twoCoins = new BN(2).mul(new BN(10).pow(new BN(DECIMALS)))
  const tenCoins = new BN(10).mul(new BN(10).pow(new BN(DECIMALS)))
  const twentyCoins = new BN(20).mul(new BN(10).pow(new BN(DECIMALS)))
  const hundredCoins = new BN(100).mul(new BN(10).pow(new BN(DECIMALS)))
  const thousandCoins = new BN(1000).mul(new BN(10).pow(new BN(DECIMALS)))

  let init = async () => {
    svc = await SVCoinContract.new({from: creatorAccount})
    erc20 = await MintableToken.new()
    await erc20.mint(creatorAccount, thousandCoins)
    // give each user 20 SVC
    await svc.transfer(user1Account, tenCoins, {from: creatorAccount})
    await svc.transfer(user2Account, tenCoins, {from: creatorAccount})
    await svc.transfer(user3Account, tenCoins, {from: creatorAccount})

    exchangeContract = await StableCoinToSVCExchange.new(svc.address, erc20.address, 'TST', {from: creatorAccount})

    // transfer assets to user2 and user3
    erc20.transfer(user2Account, twoCoins, {from: creatorAccount})
    erc20.transfer(user3Account, twoCoins, {from: creatorAccount})

    // transfer SVC and asset to exchange
    await svc.transfer(exchangeContract.address, hundredCoins, {from: creatorAccount})
    await erc20.transfer(exchangeContract.address, hundredCoins, {from: creatorAccount})
    // set quota for users
    await exchangeContract.setQuota(user1Account, twentyCoins, {from: creatorAccount})
    await exchangeContract.setQuota(user2Account, twentyCoins, {from: creatorAccount})
    let exchangeSVCBalance = await svc.balanceOf.call(exchangeContract.address)
    console.log('StableCoinToSVCExchange initial SVC balance', helpers.toRealTokenNumber(exchangeSVCBalance).toString())
  }

  describe('Token purchase', () => {
    beforeEach(init)

    it('a user should be able to buy a token with SVC', async () => {
      // then buy 1 player token
      await svc.approve(exchangeContract.address, thousandCoins, {from: user1Account})
      await exchangeContract.buy(oneCoin, {from: user1Account})

      // we expect 1 token bought 1.00 SVC to be debited from user1 acc
      let svcBalance = await svc.balanceOf.call(user1Account)
      console.log('User1 SVC balance after purchase: ', svcBalance.toString())
      expect(svcBalance).to.eq.BN(new BN(9).mul(oneCoin))
      let tokenBalance = await erc20.balanceOf.call(user1Account)
      console.log('User1 Token balance after purchase: ', tokenBalance.toString())
      expect(tokenBalance).to.eq.BN(oneCoin)
      // quota should be decreased
      let newQuota = await exchangeContract.quota.call(user1Account, {from: user1Account})
      expect(newQuota).to.eq.BN(twentyCoins.sub(oneCoin))
    })

    it('should fail if buyer has no quota', async () => {
      // user3 approves the contract to spend SVC
      await svc.approve(exchangeContract.address, oneCoin, {from: user3Account})
      await expectRevert(exchangeContract.buy(oneCoin, {from: user3Account}))
    })

    it('should fail if buyer has no money', async () => {
      // user2 approves the contract to spend SVC
      await svc.approve(exchangeContract.address, twentyCoins, {from: user2Account})
      await expectRevert(exchangeContract.buy(twentyCoins, {from: user2Account}))
    })

    it('should fail if contract has no stock', async () => {
      await exchangeContract.setQuota(user1Account, thousandCoins, {from: creatorAccount})
      await svc.approve(exchangeContract.address, thousandCoins, {from: user1Account})
      await expectRevert(exchangeContract.buy(hundredCoins, {from: user1Account}))
    })

    it('should fail if buyer has not allowed transfers', async () => {
      await expectRevert(exchangeContract.buy(oneCoin, {from: user1Account}))
    })
  })

  describe('Token sale', () => {
    beforeEach(init)

    it('a user should be able to sell an asset for SVC', async () => {
      // user2 needs to allow the exchange contract to spend his tokens
      await erc20.approve(exchangeContract.address, twoCoins, {from: user2Account})

      // then sell 1 token
      await exchangeContract.sell(oneCoin, {from: user2Account})

      // we expect 1 token to be sold for 1 SVC
      let coinBalance = await svc.balanceOf.call(user2Account)
      console.log('User2 SVC balance after purchase: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(new BN(1100).mul(new BN(10).pow(new BN(DECIMALS - 2))))
      let assetBalance = await erc20.balanceOf.call(user2Account)
      console.log('User2 Asset balance after purchase: ', assetBalance.toString())
      expect(assetBalance).to.eq.BN(oneCoin)
      // quota should be increased
      let newQuota = await exchangeContract.quota.call(user2Account, {from: user2Account})
      expect(newQuota).to.eq.BN(twentyCoins.add(oneCoin))
    })

    it('a user should be able to sell an asset for SVC without having quota', async () => {
      // user2 needs to allow the exchange contract to spend his tokens
      await erc20.approve(exchangeContract.address, twoCoins, {from: user3Account})

      // then sell 1 token
      await exchangeContract.sell(oneCoin, {from: user3Account})

      // we expect 1 token to be sold for 1 SVC
      let coinBalance = await svc.balanceOf.call(user3Account)
      expect(coinBalance).to.eq.BN(new BN(1100).mul(new BN(10).pow(new BN(DECIMALS - 2))))
      let assetBalance = await erc20.balanceOf.call(user3Account)
      expect(assetBalance).to.eq.BN(oneCoin)
    })

    it('should fail if seller has no tokens', async () => {
      const userAccount = accounts[4]
      // user3 approves the contract to spend player tokens
      await erc20.approve(exchangeContract.address, oneCoin, {from: userAccount})
      await expectRevert(exchangeContract.sell(oneCoin, {from: userAccount}))
    })

    it('should fail if contract has no stock', async () => {
      // user1 approve the contract to spend SVC
      await erc20.approve(exchangeContract.address, oneCoin, {from: user1Account})
      await expectRevert(exchangeContract.sell(hundredCoins, {from: user1Account}))
    })

    it('should fail if seller has not allowed transfers', async () => {
      await expectRevert(exchangeContract.sell(oneCoin, {from: user2Account}))
    })
  })

  describe('removeTokens', () => {
    beforeEach(init)

    it('should remove tokens from the exchange', async () => {
      await exchangeContract.removeTokens(twoCoins, {from: creatorAccount})

      // we expect 2 tokens to be transferred
      let tokenBalance = await erc20.balanceOf.call(exchangeContract.address)
      console.log('Exchange Asset balance: ', tokenBalance.toString())
      expect(tokenBalance).to.eq.BN(hundredCoins.sub(twoCoins))
    })

    it('should remove SVC from the exchange', async () => {
      await exchangeContract.removeSVC(twoCoins, {from: creatorAccount})

      // we expect 2 tokens to be transferred
      let coinBalance = await svc.balanceOf.call(exchangeContract.address)
      console.log('Exchange SVC balance: ', coinBalance.toString())
      expect(coinBalance).to.eq.BN(hundredCoins.sub(twoCoins))
    })

    it('should fail if not enough assets', async () => {
      await expectRevert(exchangeContract.removeTokens(thousandCoins.mul(new BN(2)), {from: creatorAccount}))
      await expectRevert(exchangeContract.removeSVC(thousandCoins.mul(new BN(2)), {from: creatorAccount}))
    })

  })
})
