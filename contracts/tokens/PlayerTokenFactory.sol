pragma solidity 0.4.24;

import "./PlayerToken.sol";
import "./Ownable.sol";

/**
* This contract implements a Factory pattern to create player tokens for a specific market / sport
*/
contract PlayerTokenFactory is Ownable {
  string public name;
  string public sport;
  string public version = "0.1";
  address[] public tokenList;

  constructor(string _name, string _sport) public {
    name = _name;
    sport = _sport;
  }

  /**
  * Creates a new PlayerToken and stores the address in tokenList
  */
  function createToken(uint initialBalance, string _name, string _symbol) public onlyOwner returns (address token) {
    PlayerToken newToken = new PlayerToken(0, _name, _symbol, sport);
    newToken.mint(owner, initialBalance);
    newToken.transferOwnership(owner);
    tokenList.push(newToken);
    return newToken;
  }
}
