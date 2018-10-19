pragma solidity 0.4.24;

import "./MintableToken.sol";

/**
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20

This token represents a tradeable player
*/
contract PlayerToken is MintableToken {

  // meta data
  string public constant version = '1.0';
  uint256 public constant decimals = 18;

  string public symbol;
  string public name;
  uint public id;


  /**
  * Constructor for a new Player Token.
  * @param initialBalance balance (18 decimals)
  * @param _name name of footballer
  * @param _symbol token symbol
  * @param _id id used to identify the token in the market
  */
  constructor(uint initialBalance, string _name, string _symbol, uint _id) public {
    name = _name;
    symbol = _symbol;
    id = _id;
    _mint(msg.sender, initialBalance);
  }

}
