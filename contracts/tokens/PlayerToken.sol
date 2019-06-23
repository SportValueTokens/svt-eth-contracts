pragma solidity 0.4.24;

import "./AssetToken.sol";

/**
This token represents a tradeable player
*/
contract PlayerToken is AssetToken {
  /**
  * Constructor for a new Player Token.
  * @param initialBalance balance (18 decimals)
  * @param _name name of footballer
  * @param _symbol unique token symbol
  * @param _sport sport name (eg football)
  */
  constructor(uint initialBalance, string _name, string _symbol, string _sport)
  AssetToken(initialBalance, _name, _symbol, _sport) public {}
}
