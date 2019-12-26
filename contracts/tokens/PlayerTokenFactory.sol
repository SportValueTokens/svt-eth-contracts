pragma solidity 0.5.14;

import "./PlayerToken.sol";
import "./Ownable.sol";

/**
* This contract implements a Factory pattern to create player tokens for a specific market / sport
*/
contract PlayerTokenFactory is Ownable {
  // numerical id of the market
  uint32 public market_id;
  // market name eg football
  string public market;
  string public version = "0.1";

  // counter used to assign token ids
  uint32 public lastId = 0;
  // list of token addresses that have been created
  address[] public tokenList;
  // token addresses indexed by their id
  mapping(uint32 => address) public tokenAddr;

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
  constructor(uint32 _market_id, string memory _market) public {
    market_id = _market_id;
    market = _market;
  }

  /**
  * This is needed because there is no way to return an array in a solidity method.
  * You have to call tokenList(i) to get an element of the array
  */
  function getTokenCount() public view returns(uint) {
    return tokenList.length;
  }

  /**
  * Creates a new PlayerToken and stores the address in tokenList
  */
  function createToken(uint initialBalance, string memory _name, string memory _symbol) public onlyOwner {
    lastId++;
    PlayerToken newToken = new PlayerToken(0, lastId, _symbol, _name, market);
    newToken.mint(owner, initialBalance);
    newToken.transferOwnership(owner);
    tokenList.push(address(newToken));
    tokenAddr[lastId] = address(newToken);
    emit AssetCreated(msg.sender, address(newToken), _symbol, initialBalance);
  }
}
