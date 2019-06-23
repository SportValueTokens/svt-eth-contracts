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
  string public sport;


  /**
  * Constructor for a new AssetToken.
  * @param initialBalance balance (18 decimals)
  * @param _name name
  * @param _symbol unique token symbol
  * @param _sport sport name (eg football)
  */
  constructor(uint initialBalance, string _name, string _symbol, string _sport) internal {
    name = _name;
    symbol = _symbol;
    sport = _sport;
    _mint(msg.sender, initialBalance);
  }

}
