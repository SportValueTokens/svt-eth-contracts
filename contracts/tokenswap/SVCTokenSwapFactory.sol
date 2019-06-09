pragma solidity 0.4.24;

import "../tokens/SportValueCoin.sol";
import "../tokens/AssetToken.sol";
import "../tokens/PlayerToken.sol";
import "../tokens/Ownable.sol";
import "../tokens/ERC20.sol";
import "../tokenswap/SVCTokenSwap.sol";

contract SVCTokenSwapFactory is Ownable {
  string public name;
  string public version = "0.1";
  address coinAddress;
  // token address => Exchange contracts
  mapping(address => SVCTokenSwap) exchanges;
  address[] public tokenList;

  constructor(string _name, address _coinAddress) public {
    name = _name;
    coinAddress = _coinAddress;
  }

  function createExchange(address asset) public onlyOwner returns (address exchange) {
    require(asset != address(0));
    SVCTokenSwap newExchange = new SVCTokenSwap(coinAddress, asset);
    exchanges[asset] = newExchange;
    tokenList.push(asset);
    return newExchange;
  }

  function getExchange(address asset) public view returns (address exchange) {
    return exchanges[asset];
  }
}
