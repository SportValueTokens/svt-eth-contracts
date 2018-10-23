pragma solidity 0.4.24;

import "./Crowdsale.sol";
import "./Ownable.sol";
import "./SportValueCoin.sol";
import "./ERC20.sol";
import "./SafeERC20.sol";


/**
* Contract for the Exclusive crowd sale only
*/
contract BasicSVCExchange is Ownable {

  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  // The token being sold
  ERC20 public token;

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei.
  uint256 public rate;

  event TokenPurchase(
    address indexed purchaser,
    uint price,
    uint eth,
    uint tokens
  );

  event TokenSale(
    address indexed seller,
    uint price,
    uint eth,
    uint tokens
  );

  /**
   * @param _rate Number of token units a buyer gets per wei
   * @param _wallet Address where collected funds will be forwarded to
   * @param _token Address of the token being sold
   */
  constructor(uint256 _rate, address _wallet, ERC20 _token) public {
    require(_rate > 0);
    require(_wallet != address(0));
    require(_token != address(0));

    rate = _rate;
    wallet = _wallet;
    token = _token;
  }

  /**
   * @dev fallback function ***DO NOT OVERRIDE***
   */
  function() external payable {
    buyTokens();
  }

  function buyTokens() public payable {
    address _beneficiary = msg.sender;
    uint256 weiAmount = msg.value;
    require(weiAmount != 0);

    // calculate token amount to be created
    uint256 tokenAmount = weiAmount.mul(rate);

    // send ERC20 tokens
    token.safeTransfer(_beneficiary, tokenAmount);

    emit TokenPurchase(msg.sender, rate, weiAmount, tokenAmount);
  }

  function sellTokens(uint _amount) public {
    require(_amount != 0);
    address _beneficiary = msg.sender;

    // calculate wei amount to be sent
    uint256 weiAmount = _amount.div(rate);

    // send ERC20 tokens
    token.safeTransfer(this, _amount);

    emit TokenSale(msg.sender, rate, weiAmount, _amount);

    // send ETH to seller
    _beneficiary.transfer(weiAmount);
  }

  // TODO get the ether
  // TODO open/close

}
