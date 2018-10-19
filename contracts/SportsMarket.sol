pragma solidity 0.4.24;
import "./SportValueCoin.sol";
import "./PlayerToken.sol";
import "./Ownable.sol";

contract SportsMarket is Ownable {
  SportValueCoin public coinContract;

  // list of tradeable assets (as tokens), indexed by their id
  mapping(uint => PlayerToken) private assets;

  // trader's deposits in SVCoins
  mapping(address => uint) private deposits;

  // price for each market identified by id
  mapping(uint => uint) public prices;

  // ranking of assets identified by id
  mapping(uint => uint) public ranks;

  function addPlayerToken(PlayerToken _playerToken) onlyOwner {

  }

  // update latest ranks only oracle can do it
  function updateRanks() onlyOwner {

  }

  function depositTokens() {

  }

  function withdrawTokens() {
    // TODO get commission
  }

  function buy(string _code, uint8 _number) {
    // get coin
    // mint new tokens based on price and fees if no stock
    // transfer token to buyer from SportsMarket
    // move price
  }

  function sell(string _code, uint8 _number) {
    // transfer token from user to SportsMarket
    // transfer coin to buyer based on price minus fees
    // move price
  }

  // payout to trader
  function sendPayout(address _depositAddress) onlyOwner {

  }

  // trader gets his payout
  function getPayout() {

  }
}
