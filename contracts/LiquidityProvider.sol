pragma solidity 0.4.24;

import "./tokens/SportValueCoin.sol";
import "./tokens/AssetToken.sol";
import "./tokens/Ownable.sol";
import "./tokens/ERC20.sol";
import "./MarketManager.sol";

contract LiquidityProvider is Ownable {
  string public version = '0.1';
  string marketName;

  SportValueCoin public coinContract;
  MarketManager public marketManagerContract;

  // list of tradeable assets (as tokens), indexed by their id
  mapping(uint => AssetToken) private assets;

  // trader's deposits in SVCoins
  // mapping(address => uint) private deposits;

  // price for each market identified by id
  // price is in SVC
  mapping(uint => uint) public prices;

  // number of decimals we keep for price
  uint public constant decimals = 4;

  // each unit purchased will increase the price by price_delta
  uint public priceDelta = 10 ** 2;

  event TokenPurchase(
    address indexed purchaser,
    uint assetId,
    uint number,
    uint price,
    uint value
  );

  event TokenPurchaseDebug(
    address indexed purchaser,
    uint assetId,
    uint nbAssets,
    uint price,
    uint nbCoins,
    uint availableAssetBalance
  );

  event TokenSale(
    address indexed seller,
    uint number,
    uint price,
    uint value
  );

  event Dividend(
    address indexed tokenHolder,
    uint amount
  );

  constructor(string _marketName, address coinAddress) public {
    marketName = _marketName;
    coinContract = SportValueCoin(coinAddress);
  }

  function setMarketManager(address marketManagerAddress) public onlyOwner {
    marketManagerContract = MarketManager(marketManagerAddress);
  }

  function addAssetToMarket(address assetTokenAddress, uint price) public onlyOwner {
    AssetToken assetToken = AssetToken(assetTokenAddress);
    assets[assetToken.id()] = assetToken;
    prices[assetToken.id()] = price;
  }

  function removeAssetFromMarket(address assetTokenAddress) public onlyOwner {
    AssetToken assetToken = AssetToken(assetTokenAddress);
    delete assets[assetToken.id()];
    delete prices[assetToken.id()];
  }

  function updatePriceOnBuy(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] + nbAssets / 10 ** 18 * priceDelta;
  }

  function updatePriceOnSell(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] - nbAssets / 10 ** 18 * priceDelta;
  }

  function getAssetPrice(uint assetId) public view returns (uint) {
    return prices[assetId];
  }

  // call MarketManager to create new assets
  function buyAssetsFromMarketManager(uint assetId,uint nbAssets,uint price) internal {
    uint nbCoins = price * nbAssets / (10 ** decimals);
    require(coinContract.approve(marketManagerContract,nbCoins),"Failed to approve SVC for MarketManager");
    require(marketManagerContract.createNewTokens(assetId,nbAssets,price),"Failed to buy new assets from MarketManager");
  }

  function buy(uint assetId, uint nbAssets) public {
    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, 0, 0, 0);

    // how many SVC buyer needs to buy this asset
    uint price = prices[assetId];
    uint nbCoins = price * nbAssets / 10 ** decimals;
    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, price, nbCoins, 0);

    // get paid in SVC
    require(coinContract.transferFrom(msg.sender, this, nbCoins), "Failed coin transfer from buyer to liquidity contract");

    // check how many assets the contract owns
    AssetToken assetContract = AssetToken(assets[assetId]);
    uint availableAssetBalance = assetContract.balanceOf(this);

    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, price, nbCoins, availableAssetBalance);
    if (nbAssets > availableAssetBalance) {
      uint nbAssetsToBuy = nbAssets - availableAssetBalance;
      buyAssetsFromMarketManager(assetId,nbAssetsToBuy,price);
    }

    // sending the tokens to the buyer
    require(assetContract.transfer(msg.sender, nbAssets), "Failed asset transfer from liquidity contract to buyer");
    // update price if transfer is a success
    updatePriceOnBuy(assetId, nbAssets);
    emit TokenPurchase(msg.sender, assetId, nbAssets, price, nbCoins);
  }

  function sell(uint assetId, uint nbAssets) public {
    // how many SVC buyer gets for that asset
    uint price = prices[assetId];
    uint nbCoins = price * nbAssets / 10 ** decimals;
    AssetToken assetContract = AssetToken(assets[assetId]);
    require(assetContract.transferFrom(msg.sender, this, nbAssets), "Failed asset transfer from seller to liquidity contract");
    require(coinContract.transfer(msg.sender, nbCoins), "Failed coin transfer from liquidity contract to seller");
    updatePriceOnSell(assetId, nbAssets);
    emit TokenSale(msg.sender, nbAssets, price, nbCoins);
  }

}
