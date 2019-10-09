pragma solidity 0.4.24;

import "../tokens/Ownable.sol";
import "../tokenswap/SVCTokenSwap.sol";

/**
* A contract factory to create new SVCTokenSwap instances for each token instance
*/
contract SVCTokenSwapFactory is Ownable {
  uint32 public market_id;
  string public market;
  string public version = "0.1";
  address public coinAddress;
  // token address => Exchange contracts
  mapping(address => SVCTokenSwap) public tokenSwaps;
  address[] public tokenList;

  event TokenSwapCreated (
    address indexed creator,
    address indexed addr,
    address indexed assetAddr
  );

  /**
  * @param _coinAddress address of SVC contract
  * @param _market_id id of the market
  * @param _market market name
  */
  constructor(address _coinAddress, uint32 _market_id, string _market) public {
    coinAddress = _coinAddress;
    market = _market;
    market_id = _market_id;
  }

  /**
  * This is needed because there is no way to return an array in a solidity method.
  * You have to call tokenList(i) to get an element of the array
  */
  function getTokenCount() public view returns(uint) {
    return tokenList.length;
  }

  /**
  * Create a new SVCTokenSwap contract for the give asset ERC20 token
  * @param asset the address of the ERC20 contract of the asset
  */
  function createTokenSwap(address asset) public onlyOwner returns (address) {
    require(asset != address(0));
    SVCTokenSwap tokenSwap = new SVCTokenSwap(coinAddress, asset);
    tokenSwap.transferOwnership(owner);
    tokenSwaps[asset] = tokenSwap;
    tokenList.push(asset);
    emit TokenSwapCreated(msg.sender, tokenSwap, asset);
    return tokenSwap;
  }
}
