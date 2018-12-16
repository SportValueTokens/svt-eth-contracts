pragma solidity 0.4.24;

import "./tokens/SportValueCoin.sol";
import "./tokens/AssetToken.sol";
import "./tokens/Ownable.sol";
import "./tokens/ERC20.sol";


//
// Contract to generate and track tradeable tokens for a given market
// Tokens are minted on excess demand
// Proceeds from token sales used for dividend payouts
//
contract MarketManager is Ownable {
  string public version = '0.1';
  string public name;

  SportValueCoin public coinContract;

  // list of tradeable assets (as tokens), indexed by their id
  mapping(uint => AssetToken) private assets;

  // trader's deposits in SVCoins
  // mapping(address => uint) private deposits;

  // minimum price for each market identified by id
  // price is in SVC
  mapping(uint => uint) public prices;

  // number of decimals we keep for price
  uint public decimals = 4;

  // each unit purchased will increase the price by price_delta
  uint public priceDelta = 10 ** 2;

  event TokensIssued (
    address indexed purchaser,
    uint number,
    uint price
  );

  event Dividend(
    address indexed tokenHolder,
    uint amount
  );

  constructor(string _name, address coinAddress) public {
    name = _name;
    coinContract = SportValueCoin(coinAddress);
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

  function getAssetPrice(uint assetId) public view returns (uint) {
    return prices[assetId];
  }

  function updatePriceOnBuy(uint assetId, uint nbAssets) private {
    prices[assetId] = prices[assetId] + nbAssets / 10 ** 18 * priceDelta;
  }

  function createNewTokens(uint assetId, uint nbTokens, uint reservePrice) public returns (bool success) {
    uint price = prices[assetId];
    require(price<=reservePrice,"price is higher than reserve price");
    uint nbCoins = price * nbTokens / 10 ** decimals;
    AssetToken assetContract = AssetToken(assets[assetId]);
    require(coinContract.transferFrom(msg.sender, this, nbCoins), "Failed coin transfer from buyer to liquidity contract");
    require(assetContract.mint(msg.sender, nbTokens), "Failed to mint asset");
    updatePriceOnBuy(assetId, nbTokens);
    emit TokensIssued(msg.sender, nbTokens, price);
    return true;
  }

  // pay dividend
  function payoutTo(address tokenHolder, uint amount) public onlyOwner {
    require(coinContract.transfer(tokenHolder, amount), "Failed dividend payout");
    emit Dividend(tokenHolder, amount);
  }

}
