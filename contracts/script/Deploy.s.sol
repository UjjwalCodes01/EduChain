// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PoolFactory} from "../src/PoolFactory.sol";

/**
 * @title Deploy
 * @notice Deployment script for PoolFactory contract
 * @dev Run with: forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --broadcast
 */
contract Deploy is Script {
    function run() external returns (PoolFactory) {
        // Get deployer's private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PoolFactory
        console.log("Deploying PoolFactory...");
        PoolFactory factory = new PoolFactory();
        
        console.log("========================================");
        console.log("PoolFactory deployed to:", address(factory));
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        console.log("========================================");

        // Stop broadcasting
        vm.stopBroadcast();

        return factory;
    }
}
