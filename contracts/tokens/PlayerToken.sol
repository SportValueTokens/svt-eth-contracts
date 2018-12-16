pragma solidity 0.4.24;

import "./AssetToken.sol";

/**
This token represents a tradeable player
*/
contract PlayerToken is AssetToken {
  string public sport;

  /**
  * Constructor for a new Player Token.
  * @param initialBalance balance (18 decimals)
  * @param _name name of footballer
  * @param _symbol token symbol
  * @param _id id used to identify the token in the market
  */
  constructor(uint initialBalance, string _name, string _sport, string _symbol, uint _id)
  AssetToken(initialBalance, _name, _symbol, _id) public {
    sport = _sport;
  }
}
