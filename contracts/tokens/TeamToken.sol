pragma solidity 0.4.24;

import "./AssetToken.sol";
import "./PlayerToken.sol";

/**
This token represents a tradeable team, composed of players
*/
contract TeamToken is AssetToken {

  // list of players composing the team with associated contracts
  mapping(uint => PlayerToken) public players;

  /**
  * Constructor for a new Team Token.
  * @param initialBalance balance (18 decimals)
  * @param _name name of footballer
  * @param _symbol token symbol
  * @param _sport sport name (eg football)
  */
  constructor(uint initialBalance, string _name, string _symbol, string _sport)
  AssetToken(initialBalance, _name, _symbol, _sport) public {}
}
