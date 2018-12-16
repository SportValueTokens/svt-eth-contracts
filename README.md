#Ethereum Smart Contracts for Sport Tokens

## Module

* contracts - Solidity smart contracts
* user-api - interface for user apps
* payouts - payouts service

 
## Test locally

    npm install -g ganache-cli
    npm install
    npm test
    
## Deploy locally

* Start testrpc
* Deploy the contracts using truffle: ```truffle migrate```
* Then launch truffle console to play with the contracts: ```truffle console```  

## Deploy on remix
```truffle-flattener [files]```

## Deploy on test net (Ropsten)

The fastest way is to use Metamask rather than running your own node.

## Deploy on live net

## Security

See https://consensys.github.io/smart-contract-best-practices/
