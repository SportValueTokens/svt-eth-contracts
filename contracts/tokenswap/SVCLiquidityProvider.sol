pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";

contract SVCLiquidityProvider is Ownable {
  string public version = '0.1';
  string name;

  SportValueCoin public coinContract;

  // list of tradeable assets (as tokens), indexed by their id
  mapping(uint => AssetToken) private assets;

  // trader's deposits in SVCoins
  // mapping(address => uint) private deposits;

  // price for each market identified by id
  // price is in SVC
  mapping(uint => uint) public prices;

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  uint public constant SVC_DECIMALS = 18;

  // each unit purchased will increase the price by price_delta
  uint public priceDelta = 10 ** 2;

  event TokenPurchase(
    address indexed purchaser,
    uint assetId,
    uint number,
    uint price,
    uint value
  );

  event TokenSale(
    address indexed seller,
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
    uint availableAssetBalance,
    string msg
  );

  event TokenSaleDebug(
    address indexed seller,
    uint assetId,
    uint nbAssets,
    uint price,
    uint nbCoins,
    uint availableSVCBalance,
    string msg
  );

  constructor(string _name, address coinAddress) public {
    name = _name;
    coinContract = SportValueCoin(coinAddress);
  }

  function addAssetToMarket(address assetTokenAddress, uint price) public onlyOwner {
    AssetToken assetToken = AssetToken(assetTokenAddress);
    require(assets[assetToken.id()] == address(0),'asset already exists');
    assets[assetToken.id()] = assetToken;
    prices[assetToken.id()] = price;
  }

  function removeAssetFromMarket(address assetTokenAddress) public onlyOwner {
    AssetToken assetToken = AssetToken(assetTokenAddress);
    delete assets[assetToken.id()];
    delete prices[assetToken.id()];
  }

  /**
  * set a specific price of an asset in SVC
  */
  function updatePrice(uint assetId, uint price) public onlyOwner {
    prices[assetId] = price;
  }

  function updatePriceOnBuy(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] + (nbAssets / 10 ** SVC_DECIMALS) * priceDelta;
  }

  function updatePriceOnSell(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] - (nbAssets / 10 ** SVC_DECIMALS) * priceDelta;
  }

  function getAssetPrice(uint assetId) public view returns (uint) {
    return prices[assetId];
  }

  function buy(uint assetId, uint nbAssets) public {
    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, 0, 0, 0, "buy start");

    // how many SVC buyer needs to buy this asset
    uint price = prices[assetId];
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many assets the contract owns
    AssetToken assetContract = AssetToken(assets[assetId]);
    require(assetContract.id() == assetId, "assetId not found");
    uint availableAssetBalance = assetContract.balanceOf(this);
    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, price, nbCoins, availableAssetBalance, "check asset balance");
    require(nbAssets <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(coinContract.transferFrom(msg.sender, this, nbCoins), "Failed coin transfer from buyer to liquidity contract");

    // sending the tokens to the buyer
    require(assetContract.transfer(msg.sender, nbAssets), "Failed asset transfer from liquidity contract to buyer");
    // update price if transfer is a success
    updatePriceOnBuy(assetId, nbAssets);
    emit TokenPurchase(msg.sender, assetId, nbAssets, price, nbCoins);
  }

  function sell(uint assetId, uint nbAssets) public {
    emit TokenSaleDebug(msg.sender, assetId, nbAssets, 0, 0, 0, "sell start");

    // how many SVC buyer gets for that asset
    uint price = prices[assetId];
    uint nbCoins = price * nbAssets / 10 ** DECIMALS;

    // check how many SVC the contract owns
    uint availableSVCBalance = coinContract.balanceOf(this);
    emit TokenPurchaseDebug(msg.sender, assetId, nbAssets, price, nbCoins, availableSVCBalance, "check SVC balance");
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    AssetToken assetContract = AssetToken(assets[assetId]);
    require(assetContract.id() == assetId, "assetId not found");
    require(assetContract.transferFrom(msg.sender, this, nbAssets), "Failed asset transfer from seller to liquidity contract");

    // transfer SVC
    require(coinContract.transfer(msg.sender, nbCoins), "Failed SVC transfer from liquidity contract to seller");

    // update price is transfer is successful
    updatePriceOnSell(assetId, nbAssets);
    emit TokenSale(msg.sender, assetId, nbAssets, price, nbCoins);
  }

}
