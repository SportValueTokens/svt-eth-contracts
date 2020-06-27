pragma solidity >=0.5.0 <0.6.0;

import "../tokens/SportValueCoin.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";
import "../library/SafeMath.sol";

/**
* Fixed price SVC - ERC20 token exchange contract. Keeps quotase to prevent abuse.
* By default users can only remove the same amount of tokens that they have put in plus 20.
* This can be overridden on demand by owners.
*/
contract StableCoinToSVCExchange is Ownable {
  using SafeMath for uint;
  string public version = '0.2';

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  // SVC per token divided times DECIMALS
  uint public price = 10000;

  ERC20 public stableCoin;
  SportValueCoin public svc;
  // ERC20 token symbol
  string public symbol;

  // how much can a wallet withdraw
  mapping (address => uint) public quota;

  event TokenPurchase (
    address indexed purchaser,
    uint number,
    uint price,
    uint value
  );

  event TokenSale(
    address indexed seller,
    uint number,
    uint price,
    uint value
  );

  /**
  * @param svcAddress address is the address of the deployed contract for SVC token
  * @param tokenAddress address is the address of the ERC20 contract of the stable coin asset
  * @param _symbol of the stable coin
  */
  constructor(address svcAddress, address tokenAddress, string memory _symbol) public {
    svc = SportValueCoin(svcAddress);
    stableCoin = ERC20(tokenAddress);
    symbol = _symbol;
  }

  /**
  * The caller wants to buy back the ERC20 coin using SVC coins. To do so, he needs to:
  * 1. authorise then contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  * @param nbTokens how many ERC20 tokens
  */
  function buy(uint nbTokens) public {
    // how many SVC buyer needs to buy this asset
    uint nbCoins = price * nbTokens / 10 ** DECIMALS;

    // check how many assets the contract owns
    uint availableAssetBalance = stableCoin.balanceOf(address(this));
    require(nbTokens <= quota[msg.sender], "No SVC quota");
    require(nbTokens <= availableAssetBalance, "Not enough tokens in stock");

    // get paid in SVC
    require(svc.transferFrom(msg.sender, address(this), nbCoins), "Failed coin transfer from buyer to exchange contract");

    // sending the tokens to the buyer
    require(stableCoin.transfer(msg.sender, nbTokens), "Failed asset transfer from liquidity contract to buyer");

    // reduce quota
    quota[msg.sender] = quota[msg.sender].sub(nbTokens);

    emit TokenPurchase(msg.sender, nbTokens, price, nbCoins);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough AssetToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  * @param nbTokens how many ERC20 tokens
  */
  function sell(uint nbTokens) public {
    // how many SVC buyer gets for that asset
    uint nbCoins = price * nbTokens / 10 ** DECIMALS;

    // check how many SVC the contract owns
    uint availableSVCBalance = svc.balanceOf(address(this));
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(stableCoin.transferFrom(msg.sender, address(this), nbTokens), "Failed asset transfer from seller to liquidity contract");

    // transfer SVC
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer from liquidity contract to seller");

    // increase quota
    quota[msg.sender] = quota[msg.sender].add(nbTokens);

    emit TokenSale(msg.sender, nbTokens, price, nbCoins);
  }

  function removeSVC(uint nbCoins) public onlyOwner {
    uint coinBalance = svc.balanceOf(address(this));
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");

    // transfer SVC to the sender
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from contract");
  }

  function removeTokens(uint nbTokens) public onlyOwner {
    uint assetBalance = stableCoin.balanceOf(address(this));
    require(nbTokens <= assetBalance, "Not enough tokens owned by the contract");
    // transfer assets to the sender
    require(stableCoin.transfer(msg.sender, nbTokens), "Failed token transfer to caller from contract");
  }

  /**
  * Owner can update price
  */
  function setPrice(uint _price) public onlyOwner {
    price = _price;
  }

  /**
  * Owner can update quotas on demand
  */
  function setQuota(address wallet, uint _quota) public onlyOwner {
    quota[wallet] = _quota;
  }

}
