const SportTradeCoin = artifacts.require('./SportTradeCoin.sol')
const SportingStartToken = artifacts.require('./SportingStarToken.sol')

module.exports = async (deployer) => {
  await deployer.deploy(SportTradeCoin)
  return deployer.deploy(SportingStartToken)
}
