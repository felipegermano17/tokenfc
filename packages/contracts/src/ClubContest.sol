// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "openzeppelin-contracts/access/AccessControl.sol";
import {ClubPass} from "./ClubPass.sol";
import {TFCToken} from "./TFCToken.sol";

contract ClubContest is AccessControl {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    error ContestAlreadyExists();
    error ContestNotFound();
    error ContestNotActive();
    error ContestAlreadyClosed();
    error DesignAlreadyExists();
    error DesignNotFound();
    error InvalidContestWindow();
    error InvalidTreasury();
    error InvalidSupportAmount();
    error MembershipRequired();
    error DesignSelectionLocked();

    struct Contest {
        uint256 clubId;
        address treasury;
        uint64 startsAt;
        uint64 endsAt;
        bool exists;
        bool closed;
        uint256 winningDesignId;
    }

    struct Design {
        string metadataURI;
        uint256 totalAmount;
        bool exists;
    }

    TFCToken public immutable tfcToken;
    ClubPass public immutable clubPass;

    mapping(uint256 contestId => Contest contest) private contests;
    mapping(uint256 contestId => uint256[] ids) private contestDesignIds;
    mapping(uint256 contestId => mapping(uint256 designId => Design design)) private designs;
    mapping(uint256 contestId => mapping(address supporter => uint256 designId)) private selectedDesignOf;
    mapping(uint256 contestId => mapping(address supporter => uint256 amount)) private supporterAmountOf;

    event ContestCreated(
        uint256 indexed contestId,
        uint256 indexed clubId,
        address indexed treasury,
        uint64 startsAt,
        uint64 endsAt
    );

    event DesignAdded(
        uint256 indexed contestId,
        uint256 indexed designId,
        string metadataURI
    );

    event SupportAdded(
        uint256 indexed contestId,
        uint256 indexed designId,
        address indexed supporter,
        uint256 amount,
        bytes32 intentId
    );

    event ContestClosed(
        uint256 indexed contestId,
        uint256 indexed winningDesignId,
        uint256 winningAmount
    );

    constructor(address admin, address operator, address tfcTokenAddress, address clubPassAddress) {
        if (admin == address(0) || tfcTokenAddress == address(0) || clubPassAddress == address(0)) {
            revert InvalidTreasury();
        }

        tfcToken = TFCToken(tfcTokenAddress);
        clubPass = ClubPass(clubPassAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);

        if (operator != address(0) && operator != admin) {
            _grantRole(OPERATOR_ROLE, operator);
        }
    }

    function createContest(
        uint256 contestId,
        uint256 clubId,
        address treasury,
        uint64 startsAt,
        uint64 endsAt
    ) external onlyRole(OPERATOR_ROLE) {
        if (contests[contestId].exists) {
            revert ContestAlreadyExists();
        }

        if (treasury == address(0)) {
            revert InvalidTreasury();
        }

        if (startsAt >= endsAt) {
            revert InvalidContestWindow();
        }

        contests[contestId] = Contest({
            clubId: clubId,
            treasury: treasury,
            startsAt: startsAt,
            endsAt: endsAt,
            exists: true,
            closed: false,
            winningDesignId: 0
        });

        emit ContestCreated(contestId, clubId, treasury, startsAt, endsAt);
    }

    function addDesign(
        uint256 contestId,
        uint256 designId,
        string calldata metadataURI
    ) external onlyRole(OPERATOR_ROLE) {
        Contest memory loadedContest = contests[contestId];
        if (!loadedContest.exists) {
            revert ContestNotFound();
        }

        if (designs[contestId][designId].exists) {
            revert DesignAlreadyExists();
        }

        designs[contestId][designId] = Design({
            metadataURI: metadataURI,
            totalAmount: 0,
            exists: true
        });
        contestDesignIds[contestId].push(designId);

        emit DesignAdded(contestId, designId, metadataURI);
    }

    function supportDesign(uint256 contestId, uint256 designId, uint256 amount, bytes32 intentId) external {
        Contest storage loadedContest = contests[contestId];
        if (!loadedContest.exists) {
            revert ContestNotFound();
        }

        if (loadedContest.closed) {
            revert ContestAlreadyClosed();
        }

        if (block.timestamp < loadedContest.startsAt || block.timestamp > loadedContest.endsAt) {
            revert ContestNotActive();
        }

        if (amount == 0) {
            revert InvalidSupportAmount();
        }

        Design storage loadedDesign = designs[contestId][designId];
        if (!loadedDesign.exists) {
            revert DesignNotFound();
        }

        if (clubPass.clubOfHolder(msg.sender) != loadedContest.clubId) {
            revert MembershipRequired();
        }

        uint256 selectedDesignId = selectedDesignOf[contestId][msg.sender];
        if (selectedDesignId != 0 && selectedDesignId != designId) {
            revert DesignSelectionLocked();
        }

        if (selectedDesignId == 0) {
            selectedDesignOf[contestId][msg.sender] = designId;
        }

        supporterAmountOf[contestId][msg.sender] += amount;
        loadedDesign.totalAmount += amount;

        tfcToken.systemTransferFrom(msg.sender, loadedContest.treasury, amount);

        emit SupportAdded(contestId, designId, msg.sender, amount, intentId);
    }

    function closeContest(uint256 contestId) external onlyRole(OPERATOR_ROLE) {
        Contest storage loadedContest = contests[contestId];
        if (!loadedContest.exists) {
            revert ContestNotFound();
        }

        if (loadedContest.closed) {
            revert ContestAlreadyClosed();
        }

        loadedContest.closed = true;

        uint256 winningDesignId;
        uint256 winningAmount;
        uint256[] memory loadedDesignIds = contestDesignIds[contestId];

        for (uint256 index = 0; index < loadedDesignIds.length; index++) {
            uint256 designId = loadedDesignIds[index];
            uint256 designAmount = designs[contestId][designId].totalAmount;

            if (designAmount > winningAmount) {
                winningAmount = designAmount;
                winningDesignId = designId;
            }
        }

        loadedContest.winningDesignId = winningDesignId;

        emit ContestClosed(contestId, winningDesignId, winningAmount);
    }

    function contest(uint256 contestId) external view returns (Contest memory) {
        Contest memory loadedContest = contests[contestId];
        if (!loadedContest.exists) {
            revert ContestNotFound();
        }

        return loadedContest;
    }

    function design(uint256 contestId, uint256 designId) external view returns (Design memory) {
        Design memory loadedDesign = designs[contestId][designId];
        if (!loadedDesign.exists) {
            revert DesignNotFound();
        }

        return loadedDesign;
    }

    function designIds(uint256 contestId) external view returns (uint256[] memory) {
        return contestDesignIds[contestId];
    }

    function supporter(address account, uint256 contestId) external view returns (uint256 designId, uint256 amount) {
        return (selectedDesignOf[contestId][account], supporterAmountOf[contestId][account]);
    }
}
