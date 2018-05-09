const SportTradeCoin = artifacts.require('./SportTradeCoin.sol')
const SportingStartToken = artifacts.require('./SportingStarToken.sol')
const Crowdsale = artifacts.require('./Crowdsale.sol')

module.exports = async (deployer) => {
  await deployer.deploy(SportTradeCoin)
  await deployer.deploy(SportingStartToken)
  return deployer.deploy(Crowdsale)
}
