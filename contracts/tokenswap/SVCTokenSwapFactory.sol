pragma solidity 0.4.24;

import "../tokens/Ownable.sol";
import "../tokenswap/SVCTokenSwap.sol";

/**
* A contract factory to create new SVCTokenSwap instances for each token instance
*/
contract SVCTokenSwapFactory is Ownable {
  string public name;
  string public version = "0.1";
  address public coinAddress;
  // token address => Exchange contracts
  mapping(address => SVCTokenSwap) private exchanges;
  address[] public tokenList;

  constructor(string _name, address _coinAddress) public {
    name = _name;
    coinAddress = _coinAddress;
  }

  /**
  * Create a new SVCTokenSwap contract for the give asset ERC20 token
  * @param asset the address of the ERC20 contract of the asset
  */
  function createExchange(address asset) public onlyOwner returns (address exchange) {
    require(asset != address(0));
    SVCTokenSwap newExchange = new SVCTokenSwap(coinAddress, asset);
    newExchange.transferOwnership(owner);
    exchanges[asset] = newExchange;
    tokenList.push(asset);
    return newExchange;
  }

  function getExchange(address asset) public view returns (address exchange) {
    return exchanges[asset];
  }
}
