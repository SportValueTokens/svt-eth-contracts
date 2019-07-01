const SportValueCoin = artifacts.require('tokens/SportValueCoin.sol')
const PlayerTokenFactory = artifacts.require('tokens/PlayerTokenFactory.sol')
const SVCTokenSwapFactory = artifacts.require('tokenswap/SVCTokenSwapFactory.sol')

// Deploy only on  test ad dev envs with this
module.exports = async function (deployer) {
  await deployer.deploy(SportValueCoin)
  await deployer.deploy(PlayerTokenFactory, 'Football Players Token Factory', 'football')
  await deployer.deploy(SVCTokenSwapFactory, 'Football Players Exchange Factory', SportValueCoin.address)
}
