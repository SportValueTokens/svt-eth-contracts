pragma solidity 0.4.24;

import "./AssetToken.sol";

/**
This token represents a tradeable player
*/
contract PlayerToken is AssetToken {
  string public constant version = '0.1';

  /**
  * Constructor for a new Player Token.
  * @param initialBalance balance (18 decimals)
  * @param _id number
  * @param _name name of footballer
  * @param _symbol unique token symbol
  * @param _market sport name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string _symbol, string _name, string _market)
  AssetToken(initialBalance, _id, _symbol, _name, _market) public {}
}
