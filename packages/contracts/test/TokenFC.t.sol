// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ClubContest} from "../src/ClubContest.sol";
import {ClubPass} from "../src/ClubPass.sol";
import {TFCToken} from "../src/TFCToken.sol";

contract TokenFCTest is Test {
    uint256 internal constant CLUB_ID = 10;
    uint256 internal constant CONTEST_ID = 1;
    uint256 internal constant DESIGN_ID = 1;

    address internal admin = makeAddr("admin");
    address internal operator = makeAddr("operator");
    address internal supporter = makeAddr("supporter");
    address internal treasury = makeAddr("treasury");

    TFCToken internal tfcToken;
    ClubPass internal clubPass;
    ClubContest internal clubContest;

    function setUp() public {
        bytes32 operatorRole;

        tfcToken = new TFCToken(admin, operator);
        clubPass = new ClubPass(admin, operator);
        clubContest = new ClubContest(admin, operator, address(tfcToken), address(clubPass));
        operatorRole = tfcToken.OPERATOR_ROLE();

        vm.prank(admin);
        tfcToken.grantRole(operatorRole, address(clubContest));

        vm.prank(operator);
        clubPass.mint(supporter, CLUB_ID);

        vm.prank(operator);
        tfcToken.mint(supporter, 100 ether);

        vm.prank(operator);
        clubContest.createContest(CONTEST_ID, CLUB_ID, treasury, uint64(block.timestamp - 1), uint64(block.timestamp + 1 days));

        vm.prank(operator);
        clubContest.addDesign(CONTEST_ID, DESIGN_ID, "ipfs://tokenfc/design/1");
    }

    function testOnboardingMintGrantsClubPassAndTfc() public view {
        assertEq(clubPass.clubOfHolder(supporter), CLUB_ID);
        assertEq(tfcToken.balanceOf(supporter), 100 ether);
    }

    function testSupportDesignTransfersBalanceToTreasury() public {
        bytes32 intentId = keccak256("support-1");

        vm.prank(supporter);
        clubContest.supportDesign(CONTEST_ID, DESIGN_ID, 25 ether, intentId);

        assertEq(tfcToken.balanceOf(supporter), 75 ether);
        assertEq(tfcToken.balanceOf(treasury), 25 ether);

        (uint256 selectedDesignId, uint256 supportedAmount) = clubContest.supporter(supporter, CONTEST_ID);
        assertEq(selectedDesignId, DESIGN_ID);
        assertEq(supportedAmount, 25 ether);
    }

    function testSupportDesignLocksSelectionToFirstArt() public {
        vm.prank(operator);
        clubContest.addDesign(CONTEST_ID, 2, "ipfs://tokenfc/design/2");

        vm.prank(supporter);
        clubContest.supportDesign(CONTEST_ID, DESIGN_ID, 10 ether, keccak256("support-1"));

        vm.expectRevert(ClubContest.DesignSelectionLocked.selector);
        vm.prank(supporter);
        clubContest.supportDesign(CONTEST_ID, 2, 1 ether, keccak256("support-2"));
    }

    function testSupportDesignRequiresMatchingClubMembership() public {
        address outsider = makeAddr("outsider");

        vm.prank(operator);
        clubPass.mint(outsider, CLUB_ID + 1);

        vm.prank(operator);
        tfcToken.mint(outsider, 10 ether);

        vm.expectRevert(ClubContest.MembershipRequired.selector);
        vm.prank(outsider);
        clubContest.supportDesign(CONTEST_ID, DESIGN_ID, 1 ether, keccak256("support-3"));
    }
}
