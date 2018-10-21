pragma solidity 0.4.24;

import "./SportValueCoin.sol";
import "./AssetToken.sol";
import "./Ownable.sol";
import "./ERC20.sol";

contract LiquidityProvider is Ownable {
  SportValueCoin public coinContract;

  // list of tradeable assets (as tokens), indexed by their id
  mapping(uint => AssetToken) private assets;

  // trader's deposits in SVCoins
  // mapping(address => uint) private deposits;

  // price for each market identified by id
  // price is in SVC
  mapping(uint => uint) public prices;

  // number of decimals we keep for price
  uint public decimals = 4;

  // each unit purchased will increase the price by price_delta
  uint public priceDelta = 10 ** decimals;

  // spread is 2%, so half spread os 1% or 1/100
  uint public halfSpreadDenominator = 100;

  // weekly commission
  uint public commission;

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

  constructor(address coinAddress) public {
    coinContract = SportValueCoin(coinAddress);
  }

  function addAssetToMarket(address assetTokenAddress, uint price) public onlyOwner {
    AssetToken assetToken = AssetToken(assetTokenAddress);
    assets[assetToken.id()] = assetToken;
    prices[assetToken.id()] = price;
  }

  // TODO remove token

  function updatePriceOnBuy(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] + nbAssets * priceDelta;
  }

  function updatePriceOnSell(uint assetId, uint nb_assets) private {
    prices[assetId] = prices[assetId] - nb_assets * priceDelta;
  }

  function buy(uint assetId, uint nbAssets) public {
    // how many SVC buyer needs to buy this asset
    uint price = prices[assetId] + prices[assetId] / halfSpreadDenominator;
    uint nbCoins = price * nbAssets / 10 ** decimals;
    coinContract.transferFrom(msg.sender, this, nbCoins);
    AssetToken assetContract = AssetToken(assets[assetId]);
    assetContract.transfer(msg.sender, nbAssets);
    updatePriceOnBuy(assetId, nbAssets);
    emit TokenPurchase(msg.sender, nbAssets, price, nbCoins);
  }

  function sell(uint assetId, uint nbAssets) public {
    // how many SVC buyer gets for that asset
    uint price = prices[assetId] - prices[assetId] / halfSpreadDenominator;
    uint nbCoins = price * nbAssets;
    AssetToken assetContract = AssetToken(assets[assetId]);
//    uint nbAssetsAllowed = assetContract.allowance(msg.sender, this);
//    require(nbAssetsAllowed >= nbAssets);
    assetContract.transferFrom(msg.sender, this, nbAssets);
    coinContract.transfer(msg.sender, nbCoins);
    updatePriceOnSell(assetId, nbAssets);
    emit TokenSale(msg.sender, nbAssets, price, nbCoins);
  }

  // pay dividend
  function payoutTo(address tokenHolder, uint amount) public onlyOwner {
    require(coinContract.transfer(tokenHolder, amount));
  }

  // TODO events
  // TODO save digital signature of weekly ranks
  // use that signature to verify if someone can claim payment
}
