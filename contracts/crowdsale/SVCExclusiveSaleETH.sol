pragma solidity >=0.5.0 <0.6.0;

import "./Crowdsale.sol";
import "../tokens/Ownable.sol";
import "../tokens/SportValueCoin.sol";
import "../tokens/ERC20.sol";


/**
* Contract for the Exclusive crowd sale only
*/
contract SVCExclusiveSaleETH is Crowdsale, Ownable {
  using SafeMath for uint;

  string public constant version = '0.2';

  uint public constant ETH_CAP = 2000 * (10 ** 18);

  bool private isOpen = true;

  modifier isSaleOpen() {
    require(isOpen);
    _;
  }

  /**
  * @param _rate is the amount of tokens for 1ETH at the main event
  * @param _wallet the address collection ETH
  * @param _token the address of the token contract
  */
  constructor(uint256 _rate, address payable _wallet, address _token) public Crowdsale(_rate, _wallet, _token) {

  }

  function open() public onlyOwner {
    isOpen = true;
  }

  function close() public onlyOwner {
    isOpen = false;
  }

  function setRate(uint256 _rate) public onlyOwner {
    rate = _rate;
  }

  /**
  * Closes the sale and returns unsold tokens
  */
  function finalize() public onlyOwner {
    isOpen = false;
    token.safeTransfer(owner, token.balanceOf(address(this)));
  }

  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal isSaleOpen {
    // make sure we don't raise more than cap
    require(weiRaised < ETH_CAP, "Sale Cap reached");
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }
}
