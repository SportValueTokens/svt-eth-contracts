const marketManagerClient = require('./market-manager-client')
const accountsRepo = require('./accounts-repo')
const sportsDataRepo = require('./sports-data-repo')
const logger = require('../lib/logger')

exports.payDividends = async function (market) {
  logger.info('Paying dividends')
  let winners = sportsDataRepo.getWeeklyWinners(market)
  let payouts = accountsRepo.getAccountsForPayout(market, winners)
  marketManagerClient.makePayments(payouts)
  accountsRepo.recordPayouts(payouts)
}
