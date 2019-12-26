pragma solidity 0.5.14;

import "../tokens/AssetToken.sol";
import "../tokens/SportValueCoin.sol";
import "../tokens/Ownable.sol";

/**
* contract from which traders collect payouts.
* owns the payout pool for a market in SVC
*/
contract PlayerRank is Ownable {

  // meta data
  string public constant version = '0.1';
  uint32 public market_id;
  string public market;

  SportValueCoin svc;

  // latest rank of each token
  mapping(address => uint32) public ranks;
  // latest score for each token
  mapping(address => uint32) public scores;

  /**
  * @param _market_id id of the market
  * @param _market market name
  * @param _svcAddress SVC coin contract address
  */
  constructor(uint32 _market_id, string memory _market, address _svcAddress) public {
    market_id = _market_id;
    market = _market;
    svc = SportValueCoin(_svcAddress);
  }

  /**
  * Updates ranks for a number of tokens. The number of tokens to send is limited by gas limit!
  */
  function update(address[] memory tokens, uint32[] memory _scores, uint32[] memory _ranks) public onlyOwner {
    // delete old data
    for (uint32 i = 0; i < tokens.length; i++) {
      delete ranks[tokens[i]];
      delete scores[tokens[i]];
    }

    // record new data
    for (uint32 i = 0; i < tokens.length; i++) {
      ranks[tokens[i]] = _ranks[i];
      scores[tokens[i]] = _scores[i];
    }
  }
}
