
// File: contracts/tokens/ERC20.sol

pragma solidity 0.5.14;

/**
* Abstract contract(interface) for the full ERC 20 Token standard
* see https://github.com/ethereum/EIPs/issues/20
* This is a simple fixed supply token contract.
*/
contract ERC20 {

    /**
    * Get the total token supply
    */
    function totalSupply() public view returns (uint256 supply);

    /**
    * Get the account balance of an account with address _owner
    */
    function balanceOf(address _owner) public view returns (uint256 balance);

    /**
    * Send _value amount of tokens to address _to
    * Only the owner can call this function
    */
    function transfer(address _to, uint256 _value) public returns (bool success);

    /**
    * Send _value amount of tokens from address _from to address _to
    */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success);

    /** Allow _spender to withdraw from your account, multiple times, up to the _value amount.
    * If this function is called again it overwrites the current allowance with _value.
    * this function is required for some DEX functionality
    */
    function approve(address _spender, uint256 _value) public returns (bool success);

    /**
    * Returns the amount which _spender is still allowed to withdraw from _owner
    */
    function allowance(address _owner, address _spender) public view returns (uint256 remaining);

    /**
    * Triggered when tokens are transferred from one address to another
    */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
    * Triggered whenever approve(address spender, uint256 value) is called.
    */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// File: contracts/tokens/SafeMath.sol

pragma solidity 0.5.14;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that revert on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, reverts on overflow.
  */
  function mul(uint256 _a, uint256 _b) internal pure returns (uint256) {
    // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (_a == 0) {
      return 0;
    }

    uint256 c = _a * _b;
    require(c / _a == _b);

    return c;
  }

  /**
  * @dev Integer division of two numbers truncating the quotient, reverts on division by zero.
  */
  function div(uint256 _a, uint256 _b) internal pure returns (uint256) {
    require(_b > 0);
    // Solidity only automatically asserts when dividing by 0
    uint256 c = _a / _b;
    // assert(_a == _b * c + _a % _b); // There is no case in which this doesn't hold

    return c;
  }

  /**
  * @dev Subtracts two numbers, reverts on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 _a, uint256 _b) internal pure returns (uint256) {
    require(_b <= _a);
    uint256 c = _a - _b;

    return c;
  }

  /**
  * @dev Adds two numbers, reverts on overflow.
  */
  function add(uint256 _a, uint256 _b) internal pure returns (uint256) {
    uint256 c = _a + _b;
    require(c >= _a);

    return c;
  }

  /**
  * @dev Divides two numbers and returns the remainder (unsigned integer modulo),
  * reverts when dividing by zero.
  */
  function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    require(b != 0);
    return a % b;
  }
}

// File: contracts/tokens/StandardToken.sol

pragma solidity 0.5.14;




/**
 * @title Standard ERC20 token
 *
 * @dev Implementation of the basic standard token.
 * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
 * Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract StandardToken is ERC20 {
  using SafeMath for uint256;

  mapping(address => uint256) internal balances;

  mapping(address => mapping(address => uint256)) private allowed;

  uint256 internal totalSupply_;

  /**
  * @dev Total number of tokens in existence
  */
  function totalSupply() public view returns (uint256) {
    return totalSupply_;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param _owner The address to query the the balance of.
  * @return An uint256 representing the amount owned by the passed address.
  */
  function balanceOf(address _owner) public view returns (uint256) {
    return balances[_owner];
  }

  /**
   * @dev Function to check the amount of tokens that an owner allowed to a spender.
   * @param _owner address The address which owns the funds.
   * @param _spender address The address which will spend the funds.
   * @return A uint256 specifying the amount of tokens still available for the spender.
   */
  function allowance(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }

  /**
  * @dev Transfer token for a specified address
  * @param _to The address to transfer to.
  * @param _value The amount to be transferred.
  */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_value <= balances[msg.sender]);
    require(_to != address(0));

    balances[msg.sender] = balances[msg.sender].sub(_value);
    balances[_to] = balances[_to].add(_value);
    emit Transfer(msg.sender, _to, _value);
    return true;
  }

  /**
   * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
   * Beware that changing an allowance with this method brings the risk that someone may use both the old
   * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
   * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address which will spend the funds.
   * @param _value The amount of tokens to be spent.
   */
  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value);
    return true;
  }

  /**
   * @dev Transfer tokens from one address to another
   * @param _from address The address which you want to send tokens from
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amount of tokens to be transferred
   */
  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);
    require(_to != address(0));

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    emit Transfer(_from, _to, _value);
    return true;
  }

  /**
   * @dev Increase the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_spender] == 0. To increment
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _addedValue The amount of tokens to increase the allowance by.
   */
  function increaseApproval(address _spender, uint256 _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = (
    allowed[msg.sender][_spender].add(_addedValue));
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  /**
   * @dev Decrease the amount of tokens that an owner allowed to a spender.
   * approve should be called when allowed[_spender] == 0. To decrement
   * allowed value is better to use this function to avoid 2 calls (and wait until
   * the first transaction is mined)
   * From MonolithDAO Token.sol
   * @param _spender The address which will spend the funds.
   * @param _subtractedValue The amount of tokens to decrease the allowance by.
   */
  function decreaseApproval(address _spender, uint256 _subtractedValue) public returns (bool) {
    uint256 oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue >= oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }

  /**
   * @dev Internal function that mints an amount of the token and assigns it to
   * an account. This encapsulates the modification of balances such that the
   * proper events are emitted.
   * @param _account The account that will receive the created tokens.
   * @param _amount The amount that will be created.
   */
  function _mint(address _account, uint256 _amount) internal {
    require(_account != address(0));
    totalSupply_ = totalSupply_.add(_amount);
    balances[_account] = balances[_account].add(_amount);
    emit Transfer(address(0), _account, _amount);
  }

  /**
   * @dev Internal function that burns an amount of the token of a given
   * account.
   * @param _account The account whose tokens will be burnt.
   * @param _amount The amount that will be burnt.
   */
  function _burn(address _account, uint256 _amount) internal {
    require(_account != address(0));
    require(_amount <= balances[_account]);

    totalSupply_ = totalSupply_.sub(_amount);
    balances[_account] = balances[_account].sub(_amount);
    emit Transfer(_account, address(0), _amount);
  }

  /**
   * @dev Internal function that burns an amount of the token of a given
   * account, deducting from the sender's allowance for said account. Uses the
   * internal _burn function.
   * @param _account The account whose tokens will be burnt.
   * @param _amount The amount that will be burnt.
   */
  function _burnFrom(address _account, uint256 _amount) internal {
    require(_amount <= allowed[_account][msg.sender]);

    // Should https://github.com/OpenZeppelin/zeppelin-solidity/issues/707 be accepted,
    // this function needs to emit an event with the updated approval.
    allowed[_account][msg.sender] = allowed[_account][msg.sender].sub(_amount);
    _burn(_account, _amount);
  }
}

// File: contracts/tokens/SafeERC20.sol

pragma solidity 0.5.14;




/**
 * @title SafeERC20
 * @dev Wrappers around ERC20 operations that throw on failure.
 * To use this library you can add a `using SafeERC20 for ERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
  function safeTransfer(
    ERC20 _token,
    address _to,
    uint256 _value
  )
  internal
  {
    require(_token.transfer(_to, _value));
  }

  function safeTransferFrom(
    ERC20 _token,
    address _from,
    address _to,
    uint256 _value
  )
  internal
  {
    require(_token.transferFrom(_from, _to, _value));
  }

  function safeApprove(
    ERC20 _token,
    address _spender,
    uint256 _value
  )
  internal
  {
    require(_token.approve(_spender, _value));
  }
}

// File: contracts/crowdsale/Crowdsale.sol

pragma solidity 0.5.14;





/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale,
 * allowing investors to purchase tokens with ether. This contract implements
 * such functionality in its most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 * The external interface represents the basic interface for purchasing tokens, and conform
 * the base architecture for crowdsales. They are *not* intended to be modified / overridden.
 * The internal interface conforms the extensible and modifiable surface of crowdsales. Override
 * the methods to add functionality. Consider using 'super' where appropriate to concatenate
 * behavior.
 */
contract Crowdsale {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  string public constant version = '0.2';

  // The token being sold
  ERC20 public token;

  // Address where funds are collected
  address payable public wallet;

  // How many token units a buyer gets per wei.
  // The rate is the conversion between wei and the smallest and indivisible token unit.
  // So, if you are using a rate of 1 with a DetailedERC20 token with 3 decimals called TOK
  // 1 wei will give you 1 unit, or 0.001 TOK.
  uint256 public rate;

  // Amount of wei raised
  uint256 public weiRaised;

  /**
   * Event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(
    address indexed purchaser,
    address indexed beneficiary,
    uint256 value,
    uint256 amount
  );

  /**
   * @param _rate Number of token units a buyer gets per wei
   * @param _wallet Address where collected funds will be forwarded to
   * @param _token Address of the token being sold
   */
  constructor(uint256 _rate, address payable _wallet, address _token) public {
    require(_rate > 0, "rate is 0");
    require(_wallet != address(0), "wallet address is owner");
    require(_token != address(0), "token contract address is owner");

    rate = _rate;
    wallet = _wallet;
    token = ERC20(_token);
  }

  /**
   * @dev fallback function ***DO NOT OVERRIDE***
   */
  function() external payable {
    buyTokens(msg.sender);
  }

  /**
   * @dev low level token purchase ***DO NOT OVERRIDE***
   * @param _beneficiary Address performing the token purchase
   */
  function buyTokens(address _beneficiary) public payable {
    uint256 weiAmount = msg.value;
    _preValidatePurchase(_beneficiary, weiAmount);

    // calculate token amount to be created
    uint256 tokens = weiAmount.mul(rate);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    // token transfer to _beneficiary
    token.safeTransfer(_beneficiary, tokens);

    emit TokenPurchase(
      msg.sender,
      _beneficiary,
      weiAmount,
      tokens
    );

    // transfer eth to wallet
    wallet.transfer(msg.value);
  }

  /**
   * @dev Validation of an incoming purchase.
   * Use require statements to revert state when conditions are not met.
   * Use `super` in contracts that inherit from Crowdsale to extend their validations.
   * Example from CappedCrowdsale.sol's _preValidatePurchase method:
   *   super._preValidatePurchase(_beneficiary, _weiAmount);
   *   require(weiRaised.add(_weiAmount) <= cap);
   * @param _beneficiary Address performing the token purchase
   * @param _weiAmount Value in wei involved in the purchase
   */
  function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(_beneficiary != address(0), "beneficiary is owner");
    require(_weiAmount != 0, "weiAmount is 0");
  }

}

// File: contracts/tokens/Ownable.sol

pragma solidity 0.5.14;


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;

  event OwnershipRenounced(address indexed previousOwner);

  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );

  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   * @notice Renouncing to ownership will leave the contract without an owner.
   * It will not be possible to call the functions with the `onlyOwner`
   * modifier anymore.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipRenounced(owner);
    owner = address(0);
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function transferOwnership(address _newOwner) public onlyOwner {
    _transferOwnership(_newOwner);
  }

  /**
   * @dev Transfers control of the contract to a newOwner.
   * @param _newOwner The address to transfer ownership to.
   */
  function _transferOwnership(address _newOwner) internal {
    require(_newOwner != address(0));
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }
}

// File: contracts/tokens/BurnableToken.sol

pragma solidity 0.5.14;



/**
 * @title Burnable Token
 * @dev Token that can be irreversibly burned (destroyed).
 */
contract BurnableToken is StandardToken {

  event Burn(address indexed burner, uint256 value);

  /**
   * @dev Burns a specific amount of tokens.
   * @param _value The amount of token to be burned.
   */
  function burn(uint256 _value) public {
    _burn(msg.sender, _value);
  }

  /**
   * @dev Burns a specific amount of tokens from the target address and decrements allowance
   * @param _from address The address which you want to send tokens from
   * @param _value uint256 The amount of token to be burned
   */
  function burnFrom(address _from, uint256 _value) public {
    _burnFrom(_from, _value);
  }

  /**
   * @dev Overrides StandardToken._burn in order for burn and burnFrom to emit
   * an additional Burn event.
   */
  function _burn(address _who, uint256 _value) internal {
    super._burn(_who, _value);
    emit Burn(_who, _value);
  }
}

// File: contracts/tokens/SportValueCoin.sol

pragma solidity 0.5.14;


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

// File: contracts/crowdsale/SVCExclusiveSaleERC20.sol

pragma solidity 0.5.14;







/**
* Contract for the Exclusive crowd sale only
*/
contract SVCExclusiveSaleERC20 is Ownable {
  string public constant version = '0.2';
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
  constructor(uint256 _rate, address _wallet, address _token, address _svc, string memory _symbol) public {
    require(_rate > 0, "rate is 0");
    rate = _rate;
    wallet = _wallet;
    token = ERC20(_token);
    svc = ERC20(_svc);
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
    svc.safeTransfer(owner, svc.balanceOf(address(this)));
  }
}

// File: contracts/crowdsale/SVCExclusiveSaleETH.sol

pragma solidity 0.5.14;






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

// File: contracts/tokens/MintableToken.sol

pragma solidity 0.5.14;




/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with mintable token creation
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */
contract MintableToken is StandardToken, Ownable {
  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  bool public mintingFinished = false;


  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  modifier hasMintPermission() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) public hasMintPermission canMint returns (bool) {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    return true;
  }

  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() public onlyOwner canMint returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }

  // TODO add function to enable/disable minting
}

// File: contracts/tokens/AssetToken.sol

pragma solidity 0.5.14;



/**
* Implements ERC 20 Token standard: https://github.com/ethereum/EIPs/issues/20
*
* This token represents a tradeable asset (player, team, ...)
*/
contract AssetToken is MintableToken, BurnableToken {

  // meta data
  uint public constant decimals = 18;

  string public symbol;
  string public name;
  uint32 public id;
  string public market;


  /**
  * Constructor for a new AssetToken.
  * @param initialBalance balance (18 decimals)
  * @param _id asset number
  * @param _name name
  * @param _symbol unique token symbol
  * @param _market market name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string memory _symbol, string memory _name, string memory _market) internal {
    id = _id;
    symbol = _symbol;
    name = _name;
    market = _market;
    _mint(msg.sender, initialBalance);
  }

  /**
  * Allow owner to update the name
  * @param _name new name
  */
  function setName(string memory _name) public onlyOwner {
    name = _name;
  }
}

// File: contracts/exchange/SVCExchange.sol

pragma solidity 0.5.14;






/**
* This is a market making / liquidity contract inspired by Uniswap protocol but simplified.
* The idea is to keep stock of assets and currency and calculate price based on the rations of asset/currency
*/
contract SVCExchange is Ownable {
  using SafeMath for uint;

  string public version = '0.2';
  uint32 public market_id;
  // market name eg football
  string public market;
  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  SportValueCoin public svc;

  mapping(address => uint) private svcBalanceOf;

  event TokenPurchase(
    address indexed purchaser,
    address token,
    uint number,
    uint price,
    uint value
  );

  event TokenSale(
    address indexed seller,
    address token,
    uint number,
    uint price,
    uint value
  );

  /**
  * Constructor
  * @param _market_id id of the market
  * @param _market name of the market e.g. football
  * @param coinAddress address is the address of the deployed contract for SVC token
  */
  constructor(uint32 _market_id, string memory _market, address coinAddress) public {
    market_id = _market_id;
    market = _market;
    svc = SportValueCoin(coinAddress);
  }

  /**
  * Returns balance of SVC for a given asset (token)
  * @param asset the address of the ERC20 token contract
  */
  function balanceOf(address asset) public view returns (uint) {
    return svcBalanceOf[asset];
  }

  /**
  * Calculates the price of the asset in SVC coins
  * @param asset the address of the token
  * @param amount amount of tokens to trade
  * @param purchase true if a purchase, false if a sale
  */
  function getAssetPrice(AssetToken asset, uint amount, bool purchase) public view returns (uint) {
    uint assetBalance = asset.balanceOf(address(this));
    uint coinBalance = svcBalanceOf[address(asset)];
    if (purchase) {
      assetBalance = assetBalance.sub(amount);
    } else {
      assetBalance = assetBalance.add(amount);
    }
    uint price = coinBalance.mul(10 ** DECIMALS).div(assetBalance);
    return price;
  }

  /**
  * The caller wants to buy assets using SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  */
  function buy(address tokenAddr, uint amount) external {
    AssetToken asset = AssetToken(tokenAddr);
    // how many SVC buyer needs to buy this asset
    uint price = getAssetPrice(asset, amount, true);
    uint nbCoins = price.mul(amount).div(10 ** DECIMALS);

    // check how many assets the contract owns
    uint availableAssetBalance = asset.balanceOf(address(this));
    require(amount <= availableAssetBalance, "Not enough assets in stock");

    // get paid in SVC
    require(svc.transferFrom(msg.sender, address(this), nbCoins), "Failed SVC transfer from buyer to SVCExchange");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].add(nbCoins);

    // sending the tokens to the buyer
    require(asset.transfer(msg.sender, amount), "Failed asset transfer from exchange to buyer");

    emit TokenPurchase(msg.sender, address(asset), amount, price, nbCoins);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough AssetToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  */
  function sell(address tokenAddr, uint amount) external {
    AssetToken asset = AssetToken(tokenAddr);
    // how many SVC buyer gets for that asset
    uint price = getAssetPrice(asset, amount, false);
    uint nbCoins = price.mul(amount).div(10 ** DECIMALS);

    // check how many SVC the contract owns
    uint availableSVCBalance = svcBalanceOf[tokenAddr];
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, address(this), amount), "Failed asset transfer from seller to SVCExchange");

    // transfer SVC
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer from SVCExchange to seller");

    // update virtual balance of SVC for the token
    svcBalanceOf[tokenAddr] = svcBalanceOf[tokenAddr].sub(nbCoins);

    emit TokenSale(msg.sender, address(asset), amount, price, nbCoins);
  }

  function addSVC(address assetAddr, uint nbCoins) public onlyOwner {
    // transfer SVC to the contract
    require(svc.transferFrom(msg.sender, address(this), nbCoins), "Failed SVC transfer from caller to SVCExchange");
    // update virtual balance of SVC for the token
    svcBalanceOf[assetAddr] = svcBalanceOf[assetAddr].add(nbCoins);
  }

  function removeSVC(address assetAddr, uint nbCoins) public onlyOwner {
    uint coinBalance = svcBalanceOf[assetAddr];
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");
    // transfer SVC to the sender
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from SVCExchange");
    // update virtual balance of SVC for the token
    svcBalanceOf[assetAddr] = svcBalanceOf[assetAddr].sub(nbCoins);
  }

  function addAssets(address tokenAddr, uint nbAssets) public onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    // transfer assets to the contract
    require(asset.transferFrom(msg.sender, address(this), nbAssets), "Failed asset transfer from caller to SVCExchange");
  }

  function removeAssets(address tokenAddr, uint nbAssets) public onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    uint assetBalance = asset.balanceOf(address(this));
    require(nbAssets <= assetBalance, "Not enough assets owned by the contract");
    // transfer assets to the sender
    require(asset.transfer(msg.sender, nbAssets), "Failed asset transfer to caller from SVCExchange");
  }

  /**
  * Add initial liquidity for a new token
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function initToken(address tokenAddr, uint nbCoins, uint nbAssets) external onlyOwner {
    addAssets(tokenAddr, nbAssets);
    addSVC(tokenAddr, nbCoins);
  }

  /**
  * Add liquidity by keep existing ratio of assets because price depends on the ration. This should not modify price.
  * The caller need to have authorised the contract to transfer SVC and Assets
  */
  function addLiquidity(address tokenAddr, uint nbCoins) external onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    uint assetBalance = asset.balanceOf(address(this));
    uint coinBalance = svcBalanceOf[tokenAddr];
    uint nbAssetsToAdd = assetBalance.mul(nbCoins).div(coinBalance);
    addAssets(tokenAddr, nbAssetsToAdd);
    addSVC(tokenAddr, nbCoins);
  }

  /**
  * The owner may remove liquidity by getting back his SVC and AssetToken
  */
  function removeLiquidity(address tokenAddr, uint nbCoins) external onlyOwner {
    AssetToken asset = AssetToken(tokenAddr);
    uint assetBalance = asset.balanceOf(address(this));
    uint coinBalance = svcBalanceOf[tokenAddr];
    uint nbAssetsToRemove = assetBalance.mul(nbCoins).div(coinBalance);
    removeAssets(tokenAddr, nbAssetsToRemove);
    removeSVC(tokenAddr, nbCoins);
  }


}

// File: contracts/exchange/StableCoinToSVCExchange.sol

pragma solidity 0.5.14;






/**
* Fixed price SVC - ERC20 token exchange contract. Keeps quotase to prevent abuse.
* By default users can only remove the same amount of tokens that they have put in plus 20.
* This can be overridden on demand by owners.
*/
contract StableCoinToSVCExchange is Ownable {
  using SafeMath for uint;
  string public version = '0.2';

  // number of decimals we keep for price
  uint public constant DECIMALS = 4;

  // SVC per token divided times DECIMALS
  uint public price = 10000;

  ERC20 public stableCoin;
  SportValueCoin public svc;
  // ERC20 token symbol
  string public symbol;

  // how much can a wallet withdraw
  mapping (address => uint) public quota;

  event TokenPurchase (
    address indexed purchaser,
    uint number,
    uint price,
    uint value
  );

  event TokenSale(
    address indexed seller,
    uint number,
    uint price,
    uint value
  );

  /**
  * @param svcAddress address is the address of the deployed contract for SVC token
  * @param tokenAddress address is the address of the ERC20 contract of the stable coin asset
  * @param _symbol of the stable coin
  */
  constructor(address svcAddress, address tokenAddress, string memory _symbol) public {
    svc = SportValueCoin(svcAddress);
    stableCoin = ERC20(tokenAddress);
    symbol = _symbol;
  }

  /**
  * The caller wants to buy back the ERC20 coin using SVC coins. To do so, he needs to:
  * 1. authorise then contract to transfer enough SVC from him
  * 2. call buy by providing enough gas and specifying the number of assets (18 decimals) he wishes to buy
  * @param nbTokens how many ERC20 tokens
  */
  function buy(uint nbTokens) public {
    // how many SVC buyer needs to buy this asset
    uint nbCoins = price * nbTokens / 10 ** DECIMALS;

    // check how many assets the contract owns
    uint availableAssetBalance = stableCoin.balanceOf(address(this));
    require(nbTokens <= quota[msg.sender], "No SVC quota");
    require(nbTokens <= availableAssetBalance, "Not enough tokens in stock");

    // get paid in SVC
    require(svc.transferFrom(msg.sender, address(this), nbCoins), "Failed coin transfer from buyer to exchange contract");

    // sending the tokens to the buyer
    require(stableCoin.transfer(msg.sender, nbTokens), "Failed asset transfer from liquidity contract to buyer");

    // reduce quota
    quota[msg.sender] = quota[msg.sender].sub(nbTokens);

    emit TokenPurchase(msg.sender, nbTokens, price, nbCoins);
  }

  /**
  * The caller wants to sell assets for SVC coins. To do so, he needs to:
  * 1. authorise SVCTokenSwap contract to transfer enough AssetToken from him
  * 2. call sell by providing enough gas and specifying the number of assets (18 decimals) he wishes to sell
  * @param nbTokens how many ERC20 tokens
  */
  function sell(uint nbTokens) public {
    // how many SVC buyer gets for that asset
    uint nbCoins = price * nbTokens / 10 ** DECIMALS;

    // check how many SVC the contract owns
    uint availableSVCBalance = svc.balanceOf(address(this));
    require(nbCoins <= availableSVCBalance, "Not enough SVC in stock");

    // transfer assets to the contract
    require(stableCoin.transferFrom(msg.sender, address(this), nbTokens), "Failed asset transfer from seller to liquidity contract");

    // transfer SVC
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer from liquidity contract to seller");

    // increase quota
    quota[msg.sender] = quota[msg.sender].add(nbTokens);

    emit TokenSale(msg.sender, nbTokens, price, nbCoins);
  }

  function removeSVC(uint nbCoins) public onlyOwner {
    uint coinBalance = svc.balanceOf(address(this));
    require(nbCoins <= coinBalance, "Not enough SVC owned by the contract");

    // transfer SVC to the sender
    require(svc.transfer(msg.sender, nbCoins), "Failed SVC transfer to caller from contract");
  }

  function removeTokens(uint nbTokens) public onlyOwner {
    uint assetBalance = stableCoin.balanceOf(address(this));
    require(nbTokens <= assetBalance, "Not enough tokens owned by the contract");
    // transfer assets to the sender
    require(stableCoin.transfer(msg.sender, nbTokens), "Failed token transfer to caller from contract");
  }

  /**
  * Owner can update price
  */
  function setPrice(uint _price) public onlyOwner {
    price = _price;
  }

  /**
  * Owner can update quotas on demand
  */
  function setQuota(address wallet, uint _quota) public onlyOwner {
    quota[wallet] = _quota;
  }

}

// File: contracts/payout/Payout.sol

pragma solidity 0.5.14;





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

// File: contracts/payout/PlayerScores.sol

pragma solidity 0.5.14;




/**
*
* Records current player scores for a market
*/
contract PlayerScores is Ownable {

  // meta data
  string public constant version = '0.1';
  uint32 public market_id;
  string public market;

  SportValueCoin svc;

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
  * Updates scores for a number of tokens. The number of tokens to send is limited by gas limit!
  */
  function update(address[] memory tokens, uint32[] memory _scores) public onlyOwner {
    // delete old data
    for (uint32 i = 0; i < tokens.length; i++) {
      delete scores[tokens[i]];
    }

    // record new data
    for (uint32 i = 0; i < tokens.length; i++) {
      scores[tokens[i]] = _scores[i];
    }
  }
}

// File: contracts/tokens/PlayerToken.sol

pragma solidity 0.5.14;


/**
This token represents a tradeable player
*/
contract PlayerToken is AssetToken {
  string public constant version = '0.2';

  /**
  * Constructor for a new Player Token.
  * @param initialBalance balance (18 decimals)
  * @param _id number
  * @param _name name of footballer
  * @param _symbol unique token symbol
  * @param _market sport name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string memory _symbol, string memory _name, string memory _market)
  AssetToken(initialBalance, _id, _symbol, _name, _market) public {}
}

// File: contracts/tokens/PlayerTokenFactory.sol

pragma solidity 0.5.14;



/**
* This contract implements a Factory pattern to create player tokens for a specific market / sport
*/
contract PlayerTokenFactory is Ownable {
  // numerical id of the market
  uint32 public market_id;
  // market name eg football
  string public market;
  string public version = "0.1";

  // counter used to assign token ids
  uint32 public lastId = 0;
  // list of token addresses that have been created
  address[] public tokenList;
  // token addresses indexed by their id
  mapping(uint32 => address) public tokenAddr;

  event AssetCreated (
    address indexed creator,
    address indexed addr,
    string symbol,
    uint balance
  );

  /**
  * @param _market_id id of the market
  * @param _market name of the market
  */
  constructor(uint32 _market_id, string memory _market) public {
    market_id = _market_id;
    market = _market;
  }

  /**
  * This is needed because there is no way to return an array in a solidity method.
  * You have to call tokenList(i) to get an element of the array
  */
  function getTokenCount() public view returns(uint) {
    return tokenList.length;
  }

  /**
  * Creates a new PlayerToken and stores the address in tokenList
  */
  function createToken(uint initialBalance, string memory _name, string memory _symbol) public onlyOwner {
    lastId++;
    PlayerToken newToken = new PlayerToken(0, lastId, _symbol, _name, market);
    newToken.mint(owner, initialBalance);
    newToken.transferOwnership(owner);
    tokenList.push(address(newToken));
    tokenAddr[lastId] = address(newToken);
    emit AssetCreated(msg.sender, address(newToken), _symbol, initialBalance);
  }
}

// File: contracts/tokens/TeamToken.sol

pragma solidity 0.5.14;



/**
This token represents a tradeable team, composed of players
*/
contract TeamToken is AssetToken {
  string public constant version = '0.2';

  // list of players composing the team with associated contracts
  mapping(uint => PlayerToken) public players;

  /**
  * Constructor for a new Team Token.
  * @param initialBalance balance (18 decimals)
  * @param _id number
  * @param _name name of footballer
  * @param _symbol token symbol
  * @param _market market name (eg football)
  */
  constructor(uint initialBalance, uint32 _id, string memory _symbol, string memory _name, string memory _market)
  AssetToken(initialBalance, _id, _symbol, _name, _market) public {}
}
