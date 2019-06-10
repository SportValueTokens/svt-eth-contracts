pragma solidity 0.4.24;

import "./PlayerToken.sol";
import "./Ownable.sol";

contract PlayerTokenFactory is Ownable {
  string public name;
  string public sport;
  string public version = "0.1";
  address[] public tokenList;

  constructor(string _name, string _sport) public {
    name = _name;
    sport = _sport;
  }

  function createToken(uint initialBalance, string _name, string _symbol, uint _id) public onlyOwner returns (address token) {
    PlayerToken newToken = new PlayerToken(0, _name, _symbol, _id, sport);
    newToken.mint(owner, initialBalance);
    newToken.transferOwnership(owner);
    tokenList.push(newToken);
    return newToken;
  }
}
