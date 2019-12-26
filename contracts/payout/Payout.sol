pragma solidity 0.5.14;

import "../tokens/AssetToken.sol";
import "../tokens/SportValueCoin.sol";
import "../tokens/Ownable.sol";
import "../tokens/SafeMath.sol";

/**
* contract from which traders collect payouts.
* owns the payout pool for a market in SVC
*/
contract Payout is Ownable {

  using SafeMath for uint;

  string public constant version = '0.2';

  // the SVC currency
  SportValueCoin svc;

  event PayoutSent (
    address indexed holder,
    uint payout
  );

  mapping(address => uint) internal amountToPay;

  /**
  * @param _svcAddress SVC coin contract address
  */
  constructor(address _svcAddress) public {
    svc = SportValueCoin(_svcAddress);
  }

  function getMyPayout() external {
    uint amount = amountToPay[msg.sender];
    require(amount > 0, "Sender has no unpaid payout");
    svc.transfer(msg.sender, amount);
    amountToPay[msg.sender] = 0;
    emit PayoutSent(msg.sender, amount);
  }

  function sendPayoutTo(address recepient) external onlyOwner {
    uint amount = amountToPay[recepient];
    require(amount > 0, "Sender has no unpaid payout");
    svc.transfer(recepient, amount);
    amountToPay[recepient] = 0;
    emit PayoutSent(recepient, amount);
  }

  function getAmountOwed() external view returns (uint) {
    return amountToPay[msg.sender];
  }

  function getAmountOwedTo(address account) external onlyOwner view returns (uint) {
    return amountToPay[account];
  }

  function setAmountOwedTo(address account, uint amount) external onlyOwner {
    amountToPay[account] = amount;
  }
}
