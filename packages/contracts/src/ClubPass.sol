// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "openzeppelin-contracts/access/AccessControl.sol";
import {ERC721} from "openzeppelin-contracts/token/ERC721/ERC721.sol";

contract ClubPass is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    error ZeroAddress();
    error MembershipAlreadyExists();

    uint256 public nextTokenId = 1;

    mapping(uint256 tokenId => uint256 clubId) public clubOfToken;
    mapping(address holder => uint256 clubId) public clubOfHolder;
    mapping(address holder => uint256 tokenId) public membershipTokenOf;

    constructor(address admin, address operator) ERC721("Token F.C. Club Pass", "CLUB") {
        if (admin == address(0)) {
            revert ZeroAddress();
        }

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);

        if (operator != address(0) && operator != admin) {
            _grantRole(MINTER_ROLE, operator);
        }
    }

    function mint(address to, uint256 clubId) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) {
            revert ZeroAddress();
        }

        if (membershipTokenOf[to] != 0) {
            revert MembershipAlreadyExists();
        }

        tokenId = nextTokenId++;
        clubOfToken[tokenId] = clubId;
        clubOfHolder[to] = clubId;
        membershipTokenOf[to] = tokenId;

        _safeMint(to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
