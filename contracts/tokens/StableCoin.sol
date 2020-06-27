pragma solidity >=0.5.0 <0.6.0;

import "./StandardToken.sol";

/**
A token for tests only
*/
contract StableCoin is StandardToken {
  uint public constant decimals = 18;
  string public symbol = "DAI";

  constructor(uint initialBalance) public {
    _mint(msg.sender, initialBalance);
  }

}
