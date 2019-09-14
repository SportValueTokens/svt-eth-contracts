// call factories to deploy 10 tokens and token swaps
const web3Client = require('../lib/web3-client')
const BN = require('bn.js')
// const conf = require('../conf')

// web3Client.deployAssets(conf.tokens.football, conf.ethereum.markets.football.tokenSwapFactoryAddr,
//  conf.ethereum.markets.football.tokenFactoryAddr, conf.ethereum.ownerAccount)
// web3Client.deployAssets(conf.tokens.basketball, conf.ethereum.markets.basketball.tokenSwapFactoryAddr,
//   conf.ethereum.markets.basketball.tokenFactoryAddr, conf.ethereum.ownerAccount)
// web3Client.deployAssets(conf.tokens.cricket, conf.ethereum.markets.cricket.tokenSwapFactoryAddr,
//   conf.ethereum.markets.cricket.tokenFactoryAddr, conf.ethereum.ownerAccount)

web3Client.deployAsset('TST', 'Test', new BN('1000000000000000000000').toString(), '0x47a3fe8a4e3aC3A671c49507f95eF97b36325752', '0xE51E5d7A42A89103C8B21fB2880707DC12e65f9F')
