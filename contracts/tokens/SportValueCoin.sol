pragma solidity >=0.5.0 <0.6.0;

import "./BurnableToken.sol";

/**
Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20

This is a contract for a fixed supply coin.
*/
contract SportValueCoin is BurnableToken {

  // meta data
  string public constant symbol = "SVC";

  string public version = '1.0';

  string public constant name = "Sport Value Coin";

  uint256 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 100 * (10 ** 6) * 10 ** decimals; // 100 millions

  constructor() public {
    _mint(msg.sender, INITIAL_SUPPLY);
  }

}
