pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";
import "../tokens/SafeMath.sol";

/**
* This is a market making / liquidity contract inspired by Uniswap protocol but simplified.
* The idea is to keep stock of assets and currency and calculate price based on the rations of asset/currency
*/
contract SVCExchange is Ownable {
  using SafeMath for uint;

  string public version = '0.1';
  uint32 public market_id;
  // market name eg football
  string public market;
  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  SportValueCoin public svc;
  // TODO virtual SVC accounts for each pair
  mapping (address => uint) private svcBalanceOf;

  event TokenPurchase(
    address indexed purchaser,
    address token,
    uint number,
    uint price,
    uint value
  );

  event TokenSale(
    address indexed seller,
    address token,
    uint number,
    uint price,
    uint value
  );

  /**
  * Constructor
  * @param coinAddress address is the address of the deployed contract for SVC token
  */
  constructor(address coinAddress) public {
    svc = SportValueCoin(coinAddress);
  }

  /**
  * Returns balance of SVC for a given asset (token)
  * @param asset the address of the ERC20 token contract
  */
  function balanceOf(address asset) public view returns (uint) {
    return svcBalanceOf[asset];
  }

  /**
  * Calculates the price of the asset in SVC coins
  * @param asset the address of the token
  * @param amount amount of tokens to trade
  * @param purchase true if a purchase, false if a sale
  */
  function getAssetPrice(AssetToken asset, uint amount, bool purchase) public view returns (uint) {
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = svcBalanceOf[asset];
    if (purchase) {
      assetBalance = assetBalance.sub(amount);
    } else {
      assetBalance = assetBalance.add(amount);
    }
    uint price = coinBalance.mul(10 ** DECIMALS).div(assetBalance);
    return price;
  }

  /**
  * The caller wants to buy assets using SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  */
  function buy(address tokenAddr, uint amount) public {
    AssetToken asset = AssetToken(tokenAddr);
    // how many SVC buyer needs to buy this asset
    uint price = getAssetPrice(asset, amount, true);
    uint nbCoins = price.mul(amount).div(10 ** DECIMALS);

    // check how many assets the contract owns
    uint availableAssetBalance = asset.balanceOf(this);
    require(amount <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(svc.transferFrom(msg.sender, this, nbCoins), "Failed SVC transfer from buyer to SVCExchange");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].add(nbCoins);

    // sending the tokens to the buyer
    require(asset.transfer(msg.sender, amount), "Failed asset transfer from exchange to buyer");

    emit TokenPurchase(msg.sender, asset, amount, price, nbCoins);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough AssetToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  */
  function sell(address tokenAddr, uint amount) public {
    AssetToken asset = AssetToken(tokenAddr);
    // how many SVC buyer gets for that asset
    uint price = getAssetPrice(asset, amount, false);
    uint nbCoins = price.mul(amount).div(10 ** DECIMALS);

    // check how many SVC the contract owns
    uint availableSVCBalance = svcBalanceOf[tokenAddr];
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, amount), "Failed asset transfer from seller to SVCExchange");

    // transfer SVC
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer from SVCExchange to seller");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].sub(nbCoins);

    emit TokenSale(msg.sender, asset, amount, price, nbCoins);
  }

  /**
  * Add initial liquidity for a new token
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function initToken(address tokenAddr, uint nbCoins, uint nbAssets) public onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, nbAssets), "Failed asset transfer from caller to SVCExchange");

    // transfer SVC to the contract
    require(svc.transferFrom(msg.sender, this, nbCoins), "Failed SVC transfer from caller to SVCExchange");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = nbCoins;
  }

  /**
  * Add liquidity by keep existing ratio of assets because price depends on the ration. This should not modify price.
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function addLiquidity(address tokenAddr, uint nbCoins) public onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = svcBalanceOf[tokenAddr];

    uint nbAssetsToAdd = assetBalance.mul(nbCoins).div(coinBalance);

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, this, nbAssetsToAdd), "Failed asset transfer from caller to SVCExchange");

    // transfer SVC to the contract
    require(svc.transferFrom(msg.sender, this, nbCoins), "Failed SVC transfer from caller to SVCExchange");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].add(nbCoins);
  }

  /**
  * The owner may remove liquidity by getting back his SVC and AssetToken
  */
  function removeLiquidity(address tokenAddr, uint nbCoins) public onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    uint assetBalance = asset.balanceOf(this);
    uint coinBalance = svcBalanceOf[tokenAddr];
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");
    uint nbAssetsToRemove = assetBalance.mul(nbCoins).div(coinBalance);
    require(nbAssetsToRemove <= assetBalance, "Not enough assets owned by the contract");

    // transfer assets to the sender
    require(asset.transfer(msg.sender, nbAssetsToRemove), "Failed asset transfer to caller from SVCExchange");

    // transfer SVC to the sender
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from SVCExchange");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].sub(nbCoins);
  }


}
