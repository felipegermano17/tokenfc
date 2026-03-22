// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "openzeppelin-contracts/access/AccessControl.sol";
import {ERC20} from "openzeppelin-contracts/token/ERC20/ERC20.sol";

contract TFCToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    error ZeroAddress();

    constructor(address admin, address operator) ERC20("Token F.C.", "TFC") {
        if (admin == address(0)) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);

        if (operator != address(0) && operator != admin) {
            _grantRole(MINTER_ROLE, operator);
            _grantRole(OPERATOR_ROLE, operator);
        }
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        _burn(from, amount);
    }

    function systemTransferFrom(address from, address to, uint256 amount) external onlyRole(OPERATOR_ROLE) {
        _update(from, to, amount);
    }
}
