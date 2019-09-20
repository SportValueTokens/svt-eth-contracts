pragma solidity 0.4.24;

import "./Crowdsale.sol";
import "../tokens/Ownable.sol";
import "../tokens/SportValueCoin.sol";
import "../tokens/ERC20.sol";
import "../tokens/SafeERC20.sol";


/**
* Contract for the Exclusive crowd sale only
*/
contract SVCExclusiveSaleERC20 is Ownable {
  string public symbol;
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  uint public constant TOKEN_CAP = 2000000 * (10 ** 18);
  // number of decimals we keep for price
  uint public constant DECIMALS = 4;
  uint public amountRaised;

  // The token being sold
  ERC20 public svc;
  // The ERC20 used to pay
  ERC20 public token;
  // Address where funds are collected
  address public wallet;

  // number of tokens for 1 SVC times DECIMALS
  uint public rate;

  bool private isOpen = true;

  event TokenPurchase(
    address indexed purchaser,
    uint256 value,
    uint256 amount
  );

  /**
  * @param _rate is the amount of tokens for 1 SVC
  * @param _wallet the address collecting tokens
  * @param _token the address of the token contract
  * @param _svc the address of the svc token contract
  */
  constructor(uint256 _rate, address _wallet, ERC20 _token, ERC20 _svc, string _symbol) public {
    require(_rate > 0, "rate is 0");
    rate = _rate;
    wallet = _wallet;
    token = _token;
    svc = _svc;
    symbol = _symbol;
  }

  /**
   * @dev low level token purchase
   * @param amountSVC how many coins to buy (mind the decimals)
   */
  function buyTokens(uint amountSVC) public {
    require(isOpen);
    require(amountRaised < TOKEN_CAP, "Sale Cap reached");
    // calculate svc amount
    uint256 amountTokens = amountSVC.mul(rate).div(10 ** DECIMALS);

    // token transfer to _beneficiary
    svc.safeTransfer(msg.sender, amountSVC);
    token.safeTransferFrom(msg.sender, wallet, amountTokens);

    amountRaised = amountRaised.add(amountTokens);

    emit TokenPurchase(
      msg.sender,
      amountSVC,
      amountTokens
    );
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
    svc.safeTransfer(owner, svc.balanceOf(this));
  }
}
