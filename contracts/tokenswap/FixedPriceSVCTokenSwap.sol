pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";

/**
* Fixed price SVC - ERC20 token swap
*
*/
contract FixedPriceSVCTokenSwap is Ownable {
  string public version = '0.1';

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  // SVC per token divided times DECIMALS
  uint public price = 10000;

  ERC20 public asset;
  SportValueCoin public coin;
  string public symbol;

  event TokenPurchase(
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
  * @param coinAddress address is the address of the deployed contract for SVC token
  * @param assetAddress address is the address of the ERC20 contract of the stable coin asset
  */
  constructor(address coinAddress, address assetAddress, string _symbol) public {
    coin = SportValueCoin(coinAddress);
    asset = ERC20(assetAddress);
    symbol = _symbol;
  }

  /**
  * The caller wants to buy back the ERC20 coin using SVC coins. To do so, he needs to:
  * 1. authorise then contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  */
  function buy(uint nbAssets) public {
    // how many SVC buyer needs to buy this asset
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many assets the contract owns
    uint availableAssetBalance = asset.balanceOf(this);
    require(nbAssets <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(coin.transferFrom(msg.sender, this, nbCoins), "Failed coin transfer from buyer to liquidity contract");

    // sending the tokens to the buyer
    require(asset.transfer(msg.sender, nbAssets), "Failed asset transfer from liquidity contract to buyer");

    emit TokenPurchase(msg.sender, nbAssets, price, nbCoins);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough AssetToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  */
  function sell(uint nbAssets) public {
    // how many SVC buyer gets for that asset
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many SVC the contract owns
    uint availableSVCBalance = coin.balanceOf(this);
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, nbAssets), "Failed asset transfer from seller to liquidity contract");

    // transfer SVC
    require(coin.transfer(msg.sender, nbCoins), "Failed SVC transfer from liquidity contract to seller");

    emit TokenSale(msg.sender, nbAssets, price, nbCoins);
  }

  function removeSVC(uint nbCoins) public onlyOwner {
    uint coinBalance = coin.balanceOf(this);
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");

    // transfer SVC to the sender
    require(coin.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from contract");
  }

  function removeAssets(uint nbAssets) public onlyOwner {
    uint assetBalance = asset.balanceOf(this);
    require(nbAssets <= assetBalance, "Not enough assets owned by the contract");
    // transfer assets to the sender
    require(asset.transfer(msg.sender, nbAssets), "Failed asset transfer to caller from contract");
  }

  function setPrice(uint _price) public onlyOwner {
    price = _price;
  }

}
