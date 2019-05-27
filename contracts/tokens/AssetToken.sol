pragma solidity 0.4.24;

import "./MintableToken.sol";
import "./BurnableToken.sol";

/**
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20

This token represents a tradeable asset (player, team, ...)
*/
contract AssetToken is MintableToken, BurnableToken {

  // meta data
  string public constant version = '1.0';
  uint public constant decimals = 18;

  string public symbol;
  string public name;
  uint public id;
  string public sport;


  /**
  * Constructor for a new AssetToken.
  * @param initialBalance balance (18 decimals)
  * @param _name name
  * @param _symbol token symbol
  * @param _id id used to identify the token in the market (symbol cannot be used due to Solidity limitations)
  * @param _sport sport name (eg football)
  */
  constructor(uint initialBalance, string _name, string _symbol, uint _id, string _sport) internal {
    name = _name;
    symbol = _symbol;
    id = _id;
    sport = _sport;
    _mint(msg.sender, initialBalance);
  }

}
