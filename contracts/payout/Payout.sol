pragma solidity 0.4.24;

import "../tokens/AssetToken.sol";
import "../tokens/SportValueCoin.sol";
import "../tokens/Ownable.sol";

/**
* contract from which traders collect payouts.
* owns the payout pool for a market in SVC
*/
contract Payout is Ownable {

  // meta data
  string public constant version = '0.1.2';
  uint32 public market_id;
  string public market;

  SportValueCoin svc;

  event PayoutSent (
    address indexed holder,
    uint32 assedId,
    uint payout
  );

  // last wins
  struct Win {
    uint amount;
    AssetToken token;
  }

  Win[] public wins;
  mapping(address => uint) winsMap;
  mapping(address => bool) isPaid;


  /**
  * @param _market_id id of the market
  * @param _market market name
  * @param _svcAddress SVC coin contract address
  */
  constructor(uint32 _market_id, string _market, address _svcAddress) public {
    market_id = _market_id;
    market = _market;
    svc = SportValueCoin(_svcAddress);
  }

  function calcPayoutPerToken(AssetToken token) public view returns (uint){
    return (token.balanceOf(msg.sender) * winsMap[token]) / token.totalSupply();
  }

  function getPayment(AssetToken[] memory tokens) public {
    require(!isPaid[msg.sender],"already paid");
    uint amount = 0;
    for (uint32 i = 0; i < tokens.length; i++) {
      AssetToken token = tokens[i];
      if (token.balanceOf(msg.sender) > 0) {
        uint win = winsMap[token];
        if (win != 0) {
          amount += calcPayoutPerToken(token);
        }
      }
    }
    svc.transfer(msg.sender, amount);
    isPaid[msg.sender] = true;
    emit PayoutSent(msg.sender, token.id(), amount);
  }

  function updateWinners(address[] memory winningTokens, uint[] winningAmounts) public onlyOwner {
    // delete old data
    for (uint32 i = 0; i < wins.length; i++) {
      delete winsMap[i];
      delete isPaid[i];
    }
    delete wins;

    // record new data
    for (i = 0; i < winningTokens.length; i++) {
      AssetToken token = AssetToken(winningTokens[i]);
      Win memory win = Win(winningAmounts[i], token);
      wins.push(win);
      winsMap[token] = win.amount;
    }
  }
}
