# Sporting Stars Smart Contracts

## SportValueCoin
utility token
fixed supply - 100M, 18 decimals
burnable

## PlayerToken
represents a sports player
mintable

## Team Token
represents a team%
mintable

## SportsMarket
represents a market. make payouts based on results. funded by crowdsale.
crowdsale contract, mints new tokens each season.
tokens are minted if no stock exist
buys back tokens on current price
Price is calculated with a delta algorithm.
Later, when tokens will be traded on an exchange, it can still be used to provide liquidity with the price coming from
an oracle.
pays payouts based on sports results provided by a SportResultsOracle in SVCoin from the pre season sale.

payout rules:
- top10 ranked share payouts
- paid weekly
- amount = revenue from newly minted coins for the period (week) distributed like (50%,25%,12%,6%,3%,2%,1%)

## SportResultsOracle
contract that contains sports results for a give tournament
it will be distributed with multiple validators

