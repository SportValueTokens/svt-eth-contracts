// call factories to deploy 10 tokens and token swaps
const web3Client = require('../lib/web3-client')
const conf = require('../conf')

web3Client.deployAssets(conf.tokens.football, conf.ethereum.markets.football.tokenSwapFactoryAddr,
  conf.ethereum.markets.football.tokenFactoryAddr, conf.ethereum.ownerAccount)
web3Client.deployAssets(conf.tokens.basketball, conf.ethereum.markets.basketball.tokenSwapFactoryAddr,
  conf.ethereum.markets.basketball.tokenFactoryAddr, conf.ethereum.ownerAccount)
web3Client.deployAssets(conf.tokens.cricket, conf.ethereum.markets.cricket.tokenSwapFactoryAddr,
  conf.ethereum.markets.cricket.tokenFactoryAddr, conf.ethereum.ownerAccount)
