pragma solidity >=0.5.0 <0.6.0;

import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";
import "../library/SafeMath.sol";
import "../tokens/PlayerToken.sol";

/**
* This is a market making / liquidity contract inspired by Uniswap protocol but simplified.
* The idea is to keep stock of assets and currency and calculate price based on the rations of asset/currency
*/
contract SVCExchange is Ownable {
  using SafeMath for uint;

  string public version = '0.2';
  uint32 public market_id;
  // market name eg football
  string public market;
  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  ERC20 public stableCoin;

  // cash balance for each trading pair. key is the asset address
  mapping(address => uint) private cashBalanceOf;

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
  * @param _market_id id of the market
  * @param _market name of the market e.g. football
  * @param coinAddress address is the address of the stable coin
  */
  constructor(uint32 _market_id, string memory _market, address coinAddress) public {
    market_id = _market_id;
    market = _market;
    stableCoin = ERC20(coinAddress);
  }

  /**
  * Returns balance of stable coins for a given asset (token)
  * @param asset the address of the ERC20 token contract
  */
  function balanceOf(address asset) public view returns (uint) {
    return cashBalanceOf[asset];
  }

  /**
  * Calculates the price of the asset in SVC coins
  * @param asset the address of the token
  * @param amount amount of tokens to trade
  * @param purchase true if a purchase, false if a sale
  */
  function getAssetPrice(PlayerToken asset, uint amount, bool purchase) public view returns (uint) {
    uint assetBalance = asset.balanceOf(address(this));
    uint cashBalance = cashBalanceOf[address(asset)];
    if (purchase) {
      assetBalance = assetBalance.sub(amount);
    } else {
      assetBalance = assetBalance.add(amount);
    }
    uint price = cashBalance.mul(10 ** DECIMALS).div(assetBalance);
    return price;
  }

  /**
  * The caller wants to buy assets using SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  */
  function buy(address tokenAddr, uint amount) external {
    PlayerToken asset = PlayerToken(tokenAddr);
    // how many SVC buyer needs to buy this asset
    uint price = getAssetPrice(asset, amount, true);
    uint cashAmount = price.mul(amount).div(10 ** DECIMALS);

    // check how many assets the contract owns
    uint availableAssetBalance = asset.balanceOf(address(this));
    require(amount <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(stableCoin.transferFrom(msg.sender, address(this), cashAmount), "Failed stable coin transfer from buyer to SVCExchange");

    // update virtual balance of stable coin for the token
    cashBalanceOf[tokenAddr] = cashBalanceOf[tokenAddr].add(cashAmount);

    // sending the tokens to the buyer
    require(asset.transfer(msg.sender, amount), "Failed asset transfer from exchange to buyer");

    emit TokenPurchase(msg.sender, address(asset), amount, price, cashAmount);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough PlayerToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  */
  function sell(address tokenAddr, uint amount) external {
    PlayerToken asset = PlayerToken(tokenAddr);
    // how many SVC buyer gets for that asset
    uint price = getAssetPrice(asset, amount, false);
    uint cashAmount = price.mul(amount).div(10 ** DECIMALS);

    // check how many SVC the contract owns
    uint availableCashBalance = cashBalanceOf[tokenAddr];
    require(cashAmount <= availableCashBalance, "Not enough cash in stock");

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, address(this), amount), "Failed asset transfer from seller to SVCExchange");

    // transfer SVC
    require(stableCoin.transfer(msg.sender, cashAmount), "Failed stable coin transfer from SVCExchange to seller");

    // update virtual balance of SVC for the token
    cashBalanceOf[tokenAddr] = cashBalanceOf[tokenAddr].sub(cashAmount);

    emit TokenSale(msg.sender, address(asset), amount, price, cashAmount);
  }

  function addCash(address assetAddr, uint nbCoins) public onlyOwner {
    // transfer SVC to the contract
    require(stableCoin.transferFrom(msg.sender, address(this), nbCoins), "Failed SVC transfer from caller to SVCExchange");
    // update virtual balance of SVC for the token
    cashBalanceOf[assetAddr] = cashBalanceOf[assetAddr].add(nbCoins);
  }

  function removeCash(address assetAddr, uint nbCoins) public onlyOwner {
    uint coinBalance = cashBalanceOf[assetAddr];
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");
    // transfer SVC to the sender
    require(stableCoin.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from SVCExchange");
    // update virtual balance of SVC for the token
    cashBalanceOf[assetAddr] = cashBalanceOf[assetAddr].sub(nbCoins);
  }

  function addAssets(address assetAddr, uint nbAssets) public onlyOwner {
    PlayerToken asset = PlayerToken(assetAddr);
    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, address(this), nbAssets), "Failed asset transfer from caller to SVCExchange");
  }

  function removeAssets(address assetAddr, uint nbAssets) public onlyOwner {
    PlayerToken asset = PlayerToken(assetAddr);
    uint assetBalance = asset.balanceOf(address(this));
    require(nbAssets <= assetBalance, "Not enough assets owned by the contract");
    // transfer assets to the sender
    require(asset.transfer(msg.sender, nbAssets), "Failed asset transfer to caller from SVCExchange");
  }

  /**
  * Add liquidity by keep existing ratio of assets because price depends on the ration. This should not modify price.
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function addLiquidity(address tokenAddr, uint nbCoins) external onlyOwner {
    PlayerToken asset = PlayerToken(tokenAddr);
    uint assetBalance = asset.balanceOf(address(this));
    uint cashBalance = cashBalanceOf[tokenAddr];
    uint nbAssetsToAdd = assetBalance.mul(nbCoins).div(cashBalance);
    addAssets(tokenAddr, nbAssetsToAdd);
    addCash(tokenAddr, nbCoins);
  }

  /**
  * The owner may remove liquidity by getting back his SVC and PlayerToken
  */
  function removeLiquidity(address tokenAddr, uint nbCoins) external onlyOwner {
    PlayerToken asset = PlayerToken(tokenAddr);
    uint assetBalance = asset.balanceOf(address(this));
    uint cashBalance = cashBalanceOf[tokenAddr];
    uint nbAssetsToRemove = assetBalance.mul(nbCoins).div(cashBalance);
    removeAssets(tokenAddr, nbAssetsToRemove);
    removeCash(tokenAddr, nbCoins);
  }


}
