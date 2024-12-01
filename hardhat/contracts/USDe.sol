// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDe is ERC20 {
    constructor() ERC20("USDe", "USDe") {
        // Mint initial supply to the owner
        _mint(msg.sender, 1000000 * 10 ** decimals()); // 1,000,000 USDe
    }

    // Override decimals to return 6
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    // Faucet function for testing (remove in production)
    function faucet(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}
