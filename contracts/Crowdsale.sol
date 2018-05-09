pragma solidity ^0.4.18;

import "./SportTradeCoin.sol";
import "./library/SafeMath.sol";

contract Crowdsale {
  using SafeMath for uint256;

  SportTradeCoin tokenContract;
  bool public ended = false;
  uint256 internal refundAmount = 0;
  uint256 constant MAX_CONTRIBUTION = 5000 ether;
  uint256 constant MIN_CONTRIBUTION = 0.1 ether;
  address owner;
  address fundsAccount;
  uint256 public constant pricePerToken = 500000000;  // (wei per DDT)
  uint256 public tokensAvailable = 12 * (10 ** (6+18));  // 12M tokens

  event LogRefund(uint256 _amount);
  event LogEnded(bool _soldOut);
  event LogContribution(uint256 _amount, uint256 _tokensPurchased);

  modifier notEnded() {
    require(!ended);
    _;
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function Crowdsale(address _tokenContractAddress, address _fundsAccount) public {
    fundsAccount = _fundsAccount;
    owner = msg.sender;
    tokenContract = SportTradeCoin(_tokenContractAddress);
  }

  /// @dev Fallback function, this allows users to purchase tokens by simply sending ETH to the
  /// contract; they will however need to specify a higher amount of gas than the default (21000)
  function() notEnded payable public {
    require(msg.value >= MIN_CONTRIBUTION && msg.value <= MAX_CONTRIBUTION);

    uint256 tokensPurchased = msg.value.div(pricePerToken);

    if (tokensPurchased > tokensAvailable) {
      ended = true;
      LogEnded(true);
      refundAmount = (tokensPurchased - tokensAvailable) * pricePerToken;
      tokensPurchased = tokensAvailable;
    }

    tokensAvailable -= tokensPurchased;

    //Refund the difference
    if (ended && refundAmount > 0) {
      uint256 toRefund = refundAmount;
      refundAmount = 0;
      // reentry should not be possible
      msg.sender.transfer(toRefund);
      LogRefund(toRefund);
    }

    LogContribution(msg.value, tokensPurchased);

    tokenContract.transfer(msg.sender, tokensPurchased);

    fundsAccount.transfer(msg.value - toRefund);
  }

  /// @dev Ends the crowdsale and withdraws any remaining tokens
  /// @param _to Address to withdraw the tokens to
  function withdrawTokens(address _to) onlyOwner public {
    require(_to != address(0));
    if (!ended) {
      LogEnded(false);
    }
    ended = true;

    tokenContract.transfer(_to, tokensAvailable);
  }
}
