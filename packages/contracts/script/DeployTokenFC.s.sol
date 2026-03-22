// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ClubContest} from "../src/ClubContest.sol";
import {ClubPass} from "../src/ClubPass.sol";
import {TFCToken} from "../src/TFCToken.sol";

contract DeployTokenFC is Script {
    function run() external returns (TFCToken tfcToken, ClubPass clubPass, ClubContest clubContest) {
        uint256 deployerKey = vm.envUint("MONAD_DEPLOYER_PRIVATE_KEY");
        address admin = vm.addr(deployerKey);
        address operator = vm.envAddress("TOKENFC_OPERATOR_ADDRESS");

        vm.startBroadcast(deployerKey);

        tfcToken = new TFCToken(admin, operator);
        clubPass = new ClubPass(admin, operator);
        clubContest = new ClubContest(admin, operator, address(tfcToken), address(clubPass));

        tfcToken.grantRole(tfcToken.OPERATOR_ROLE(), address(clubContest));

        vm.stopBroadcast();

        string memory deploymentPath = string.concat(vm.projectRoot(), "/deployments/monad-testnet.json");
        string memory deploymentKey = "tokenfc";

        vm.serializeAddress(deploymentKey, "admin", admin);
        vm.serializeAddress(deploymentKey, "operator", operator);
        vm.serializeAddress(deploymentKey, "tfcToken", address(tfcToken));
        vm.serializeAddress(deploymentKey, "clubPass", address(clubPass));
        string memory json = vm.serializeAddress(deploymentKey, "clubContest", address(clubContest));
        vm.writeJson(json, deploymentPath);

        console2.log("TFCToken:", address(tfcToken));
        console2.log("ClubPass:", address(clubPass));
        console2.log("ClubContest:", address(clubContest));
    }
}
