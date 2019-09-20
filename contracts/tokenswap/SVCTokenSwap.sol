pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";

/**
* This is a market making / liquidity contract inspired by Uniswap protocol but simplified.
* The idea is to keep stock of assets and currency and calculate price based on the rations of asset/currency
*/
contract SVCTokenSwap is Ownable {
  string public version = '0.1';

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  AssetToken public asset;
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
  * @param assetAddress address is the address of the ERC20 contract of the tradeable asset
  */
  constructor(address coinAddress, address assetAddress) public {
    coin = SportValueCoin(coinAddress);
    asset = AssetToken(assetAddress);
    symbol = asset.symbol();
  }

  /**
  * Calculates the price of the asset in SVC coins
  */
  function getAssetPrice() public view returns (uint) {
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = coin.balanceOf(this);
    uint price = coinBalance * 10 ** DECIMALS / assetBalance;
    return price;
  }

  /**
  * The caller wants to buy assets using SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  */
  function buy(uint nbAssets) public {
    // how many SVC buyer needs to buy this asset
    uint price = getAssetPrice();
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
    uint price = getAssetPrice();
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

  /**
  * Add liquidity by keep existing ratio of assets because price depends on the ration. This should not modify price.
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function addLiquidity(uint nbCoins) public onlyOwner {
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = coin.balanceOf(this);

    uint nbAssetsToAdd = assetBalance * nbCoins / coinBalance;

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, nbAssetsToAdd), "Failed asset transfer from caller to contract");

    // transfer SVC to the contract
    require(coin.transferFrom(msg.sender, this, nbCoins), "Failed SVC transfer from caller to contract");
  }

  /**
  * The owner may remove liquidity by getting back his SVC and AssetToken
  */
  function removeLiquidity(uint nbCoins) public onlyOwner {
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = coin.balanceOf(this);
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");
    uint nbAssetsToRemove = assetBalance * nbCoins / coinBalance;
    require(nbAssetsToRemove <= assetBalance, "Not enough assets owned by the contract");

    // transfer assets to the sender
    require(asset.transfer(msg.sender, nbAssetsToRemove), "Failed asset transfer to caller from contract");

    // transfer SVC to the sender
    require(coin.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from contract");
  }


}
