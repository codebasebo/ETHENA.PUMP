// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Token.sol";
import "hardhat/console.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenFactory
 * @dev A platform for creating, managing, and purchasing meme tokens using an exponential bonding curve pricing mechanism.
 * The platform integrates with Uniswap V2 for automated market maker (AMM) functionality and provides methods for 
 * liquidity pool creation and funding goal tracking.
 * 
 * Key Features:
 * - Creation of meme tokens with initial supply and metadata.
 * - Calculation of token costs using an exponential bonding curve.
 * - Liquidity pool creation and liquidity provision via Uniswap V2.
 * - Auto-burn of liquidity pool tokens to lock liquidity.
 * - Tracking of funds raised by individual meme tokens.
 * 
 * @notice This contract uses the USDe stablecoin as the medium of exchange for token purchases and platform fees.
 */

contract TokenFactory is ReentrancyGuard {
    /// @notice Represents the metadata and key data points for a meme token.
    struct MemeToken {
        string name;
        string symbol;
        string description;
        string tokenImageUrl;
        uint256 fundingRaised;
        address tokenAddress;
        address creatorAddress;
    }

    address[] public memeTokenAddresses;
    mapping(address => MemeToken) public addressToMemeTokenMapping;

     // Platform constants
    uint256 constant MEMETOKEN_CREATION_PLATFORM_FEE = 25 * 10 ** 6;
    uint256 constant MEMECOIN_FUNDING_DEADLINE_DURATION = 10 days;
    uint256 constant MEMECOIN_FUNDING_GOAL = 72000e6;
    uint256 constant DECIMALS = 10 ** 18;
    uint256 constant MAX_SUPPLY = 1000000 * DECIMALS;
    uint256 constant INIT_SUPPLY = 20 * MAX_SUPPLY / 100;
    uint256 public constant INITIAL_PRICE = 5e5; // Initial price in USDe (0.5 USD)
    uint256 public constant K = 3 * 10 ** 18; // Growth rate (k), scaled to avoid precision loss

     // Addresses for external integrations
    address public immutable UNISWAP_V2_FACTORY_ADDRESS;
    address public immutable UNISWAP_V2_ROUTER_ADDRESS;
    address public immutable USDe_TOKEN_ADDRESS;


     /// @notice Event emitted when a new meme token is purchased.
    event MemeTokenBought(address indexed memeTokenAddress, uint256 tokenQty, uint256 cost);

    /// @notice Event emitted when a new meme token is created.
    event MemeTokenCreated(address indexed memeTokenAddress, uint256 tokenQty);

    constructor(address _uniswapV2FactoryAddress, address _uniswapV2RouterAddress, address _usdeTokenAddress) {
        UNISWAP_V2_FACTORY_ADDRESS = _uniswapV2FactoryAddress;
        UNISWAP_V2_ROUTER_ADDRESS = _uniswapV2RouterAddress;
        USDe_TOKEN_ADDRESS = _usdeTokenAddress;
    }

    // Function to calculate the cost in wei for purchasing `tokensToBuy` starting from `currentSupply`
    function calculateCost(uint256 currentSupply, uint256 tokensToBuy) public pure returns (uint256) {
        // Calculate the exponent parts scaled to avoid precision loss
        uint256 exponent1 = (K * (currentSupply + tokensToBuy)) / 10 ** 18;
        uint256 exponent2 = (K * currentSupply) / 10 ** 18;

        // Calculate e^(kx) using the exp function
        uint256 exp1 = exp(exponent1);
        uint256 exp2 = exp(exponent2);

        // Cost formula: (P0 / k) * (e^(k * (currentSupply + tokensToBuy)) - e^(k * currentSupply))
        // We use (P0 * 10^18) / k to keep the division safe from zero
        uint256 cost = (INITIAL_PRICE * 10 ** 18 * (exp1 - exp2)) / K; // Adjust for k scaling without dividing by zero
        return cost;
    }

    // Improved helper function to calculate e^x for larger x using a Taylor series approximation
    function exp(uint256 x) internal pure returns (uint256) {
        uint256 sum = 10 ** 18; // Start with 1 * 10^18 for precision
        uint256 term = 10 ** 18; // Initial term = 1 * 10^18
        uint256 xPower = x; // Initial power of x

        for (uint256 i = 1; i <= 20; i++) {
            // Increase iterations for better accuracy
            term = (term * xPower) / (i * 10 ** 18); // x^i / i!
            sum += term;

            // Prevent overflow and unnecessary calculations
            if (term < 1) break;
        }

        return sum;
    }

    // Function to create a new meme token with the specified metadata
    function createMemeToken(
        string memory name,
        string memory symbol,
        string memory imageUrl,
        string memory description
    ) public returns (address) {
        IERC20 usdtTokenCt = IERC20(USDe_TOKEN_ADDRESS);
        require(
            usdtTokenCt.transferFrom(msg.sender, address(this), MEMETOKEN_CREATION_PLATFORM_FEE),
            "fee not paid for memetoken creation"
        );
        console.log("Caller USDT Balance:", usdtTokenCt.balanceOf(msg.sender));
        console.log("Allowance for Factory:", usdtTokenCt.allowance(msg.sender, address(this)));
        Token ct = new Token(name, symbol, INIT_SUPPLY);
        address memeTokenAddress = address(ct);
        MemeToken memory newlyCreatedToken =
            MemeToken(name, symbol, description, imageUrl, 0, memeTokenAddress, msg.sender);
        memeTokenAddresses.push(memeTokenAddress);
        emit MemeTokenCreated(memeTokenAddress, INIT_SUPPLY);
        addressToMemeTokenMapping[memeTokenAddress] = newlyCreatedToken;
        return memeTokenAddress;
    }

    // Function to get all meme tokens
    function getAllMemeTokens() public view returns (MemeToken[] memory) {
        MemeToken[] memory allTokens = new MemeToken[](memeTokenAddresses.length);
        for (uint256 i = 0; i < memeTokenAddresses.length; i++) {
            allTokens[i] = addressToMemeTokenMapping[memeTokenAddresses[i]];
        }
        return allTokens;
    }

    // Function to get meme token by address
    function buyMemeToken(address memeTokenAddress, uint256 tokenQty) public returns (uint256) {
        //check if memecoin is listed
        require(addressToMemeTokenMapping[memeTokenAddress].tokenAddress != address(0), "Token is not listed");

        Token memeTokenCt = Token(memeTokenAddress);

        // check to ensure there is enough supply to facilitate the purchase
        uint256 currentSupply = memeTokenCt.totalSupply();
        console.log("Current supply of token is ", currentSupply);
        console.log("Max supply of token is ", MAX_SUPPLY);
        uint256 available_qty = MAX_SUPPLY - currentSupply;
        console.log("Qty available for purchase ", available_qty);

        uint256 scaled_available_qty = available_qty / DECIMALS;
        uint256 tokenQty_scaled = tokenQty * DECIMALS;

        require(tokenQty <= scaled_available_qty, "Not enough available supply");

        // calculate the cost for purchasing tokenQty tokens as per the exponential bonding curve formula
        uint256 currentSupplyScaled = (currentSupply - INIT_SUPPLY) / DECIMALS;
        uint256 requiredUSDe = calculateCost(currentSupplyScaled, tokenQty);

        console.log("USDe required for purchasing meme tokens is ", requiredUSDe);

        // check if user has sent correct value of eth to facilitate this purchase
        IERC20 usdeToken = IERC20(USDe_TOKEN_ADDRESS);
        require(usdeToken.transferFrom(msg.sender, address(this), requiredUSDe), "USDe transfer failed");

        // Incerement the funding
        addressToMemeTokenMapping[memeTokenAddress].fundingRaised += requiredUSDe;

        if (addressToMemeTokenMapping[memeTokenAddress].fundingRaised >= MEMECOIN_FUNDING_GOAL) {
            // create liquidity pool
            address pool = _createLiquidityPool(memeTokenAddress);
            console.log("Pool address ", pool);

            // provide liquidity
            uint256 tokenAmount = INIT_SUPPLY;
            uint256 amountUSDe = addressToMemeTokenMapping[memeTokenAddress].fundingRaised;
            uint256 liquidity = _provideLiquidity(memeTokenAddress, tokenAmount, amountUSDe);
            console.log("UNiswap provided liquidty ", liquidity);

            // burn lp token
            _burnLpTokens(pool, liquidity);
        }

        // mint the tokens
        memeTokenCt.mint(tokenQty_scaled, msg.sender);

        console.log("User balance of the tokens is ", memeTokenCt.balanceOf(msg.sender));

        console.log("New available qty ", MAX_SUPPLY - memeTokenCt.totalSupply());

        return requiredUSDe;
    }


    // Function to get meme token by address
    function _createLiquidityPool(address memeTokenAddress) internal returns (address) {
        IUniswapV2Factory factory = IUniswapV2Factory(UNISWAP_V2_FACTORY_ADDRESS);
        address pair = factory.createPair(memeTokenAddress, USDe_TOKEN_ADDRESS);
        return pair;
    }
     
     // Function to provide liquidity to the pool
    function _provideLiquidity(address memeTokenAddress, uint256 tokenAmount, uint256 USDeAmount)
        internal
        returns (uint256)
    {
        Token memeTokenCt = Token(memeTokenAddress);
        memeTokenCt.approve(UNISWAP_V2_ROUTER_ADDRESS, tokenAmount);
        IUniswapV2Router02 router = IUniswapV2Router02(UNISWAP_V2_ROUTER_ADDRESS);
        (,, uint256 liquidity) = router.addLiquidity(
            memeTokenAddress,
            USDe_TOKEN_ADDRESS,
            tokenAmount,
            USDeAmount,
            tokenAmount,
            USDeAmount,
            address(this),
            block.timestamp
        );
        return liquidity;
    }

    // Function to burn the LP tokens

    function _burnLpTokens(address pool, uint256 liquidity) internal returns (uint256) {
        IUniswapV2Pair uniswapv2pairct = IUniswapV2Pair(pool);
        uniswapv2pairct.transfer(address(0), liquidity);
        console.log("Uni v2 tokens burnt");
        return liquidity;
    }
}
