pragma solidity 0.4.24;

import "./AssetToken.sol";
import "./PlayerToken.sol";

/**
This token represents a tradeable team, composed of players
*/
contract TeamToken is AssetToken {
  string public constant version = '0.2';

  // list of players composing the team with associated contracts
  mapping(uint => PlayerToken) public players;

  /**
  * Constructor for a new Team Token.
  * @param initialBalance balance (18 decimals)
  * @param _id number
  * @param _name name of footballer
  * @param _symbol token symbol
  * @param _market market name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string _symbol, string _name, string _market)
  AssetToken(initialBalance, _id, _symbol, _name, _market) public {}
}
