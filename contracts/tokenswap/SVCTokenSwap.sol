pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";

contract SVCTokenSwap is Ownable {
  string public version = '0.1';

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  AssetToken private asset;
  SportValueCoin private coin;

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

  event TokenPurchaseDebug(
    address indexed purchaser,
    uint nbAssets,
    uint price,
    uint nbCoins,
    uint availableAssetBalance,
    string msg
  );

  event TokenSaleDebug(
    address indexed seller,
    uint nbAssets,
    uint price,
    uint nbCoins,
    uint availableSVCBalance,
    string msg
  );

  constructor(address coinAddress, address assetAddress) public {
    coin = SportValueCoin(coinAddress);
    asset = AssetToken(assetAddress);
  }

  function getAssetAddress() public view returns (address) {
    return asset;
  }

  function getAssetPrice() public view returns (uint) {
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = coin.balanceOf(this);
    uint price = coinBalance * 10 ** DECIMALS / assetBalance;
    return price;
  }

  function buy(uint nbAssets) public {
    emit TokenPurchaseDebug(msg.sender, nbAssets, 0, 0, 0, "buy start");

    // how many SVC buyer needs to buy this asset
    uint price = getAssetPrice();
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many assets the contract owns
    uint availableAssetBalance = asset.balanceOf(this);
    emit TokenPurchaseDebug(msg.sender, nbAssets, price, nbCoins, availableAssetBalance, "check asset balance");
    require(nbAssets <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(coin.transferFrom(msg.sender, this, nbCoins), "Failed coin transfer from buyer to liquidity contract");

    // sending the tokens to the buyer
    require(asset.transfer(msg.sender, nbAssets), "Failed asset transfer from liquidity contract to buyer");

    emit TokenPurchase(msg.sender, nbAssets, price, nbCoins);
  }

  function sell(uint nbAssets) public {
    emit TokenSaleDebug(msg.sender, nbAssets, 0, 0, 0, "sell start");

    // how many SVC buyer gets for that asset
    uint price = getAssetPrice();
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many SVC the contract owns
    uint availableSVCBalance = coin.balanceOf(this);
    emit TokenPurchaseDebug(msg.sender, nbAssets, price, nbCoins, availableSVCBalance, "check SVC balance");
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, nbAssets), "Failed asset transfer from seller to liquidity contract");

    // transfer SVC
    require(coin.transfer(msg.sender, nbCoins), "Failed SVC transfer from liquidity contract to seller");

    emit TokenSale(msg.sender, nbAssets, price, nbCoins);
  }

  /**
  * Add liquidity by keep existing ratio of assets
  * because price depends on the ration. This should not modify price.
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
