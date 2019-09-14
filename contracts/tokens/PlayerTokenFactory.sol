pragma solidity 0.4.24;

import "./PlayerToken.sol";
import "./Ownable.sol";

/**
* This contract implements a Factory pattern to create player tokens for a specific market / sport
*/
contract PlayerTokenFactory is Ownable {
  uint32 public market_id;
  string public market;
  string public version = "0.1";

  uint32 public lastId = 0;
  address[] public tokenList;

  event AssetCreated (
    address indexed creator,
    address indexed addr,
    string symbol,
    uint balance
  );

  /**
  * @param _market_id id of the market
  * @param _market name of the market
  */
  constructor(uint32 _market_id, string _market) public {
    market_id = _market_id;
    market = _market;
  }

  /**
  * Creates a new PlayerToken and stores the address in tokenList
  */
  function createToken(uint initialBalance, string _name, string _symbol) public onlyOwner {
    // TODO check symbol does not exist already
    lastId++;
    PlayerToken newToken = new PlayerToken(0, lastId, _symbol, _name, market);
    newToken.mint(owner, initialBalance);
    newToken.transferOwnership(owner);
    tokenList.push(newToken);
    emit AssetCreated(msg.sender, newToken, _symbol, initialBalance);
  }
}
