pragma solidity 0.5.14;

import "./MintableToken.sol";
import "./BurnableToken.sol";

/**
* Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*
* This token represents a tradeable asset (player, team, ...)
*/
contract AssetToken is MintableToken, BurnableToken {

  // meta data
  uint public constant decimals = 18;

  string public symbol;
  string public name;
  uint32 public id;
  string public market;


  /**
  * Constructor for a new AssetToken.
  * @param initialBalance balance (18 decimals)
  * @param _id asset number
  * @param _name name
  * @param _symbol unique token symbol
  * @param _market market name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string memory _symbol, string memory _name, string memory _market) internal {
    id = _id;
    symbol = _symbol;
    name = _name;
    market = _market;
    _mint(msg.sender, initialBalance);
  }

  /**
  * Allow owner to update the name
  * @param _name new name
  */
  function setName(string memory _name) public onlyOwner {
    name = _name;
  }
}
