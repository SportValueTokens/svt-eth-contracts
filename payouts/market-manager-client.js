const conf = require('../conf')
const abis = require('../abis')
const Web3 = require('web3')
const web3 = new Web3(conf.ethereum.node)

function initContracts () {
  const contracts = {}
  Object.keys(conf.ethereum.marketManagerContracts).forEach(function (market) {
    contracts[market] = new web3.eth.Contract(abis.marketManagerABI, conf.ethereum.marketManagerContracts[market])
  })

  return contracts
}

const marketManagerContracts = initContracts()

exports.payoutTo = function (market, address, amount) {
  marketManagerContracts[market].payoutTo(address, amount)
}

exports.getAvailableDivFunds = function () {

}

exports.makePayments = function () {

}
