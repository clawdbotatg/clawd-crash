// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/CrashGame.sol";

contract DeployCrashGame is ScaffoldETHDeploy {
    // CLAWD token on Base
    address constant CLAWD_TOKEN = 0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07;

    function run() external ScaffoldEthDeployerRunner {
        new CrashGame(
            CLAWD_TOKEN,
            100e18,         // minBet: 100 CLAWD
            10_000_000e18,  // maxBet: 10M CLAWD
            15,             // bettingDuration: ~30s on Base (2s blocks)
            150             // roundDuration: ~5 min max before emergency refund
        );
    }
}
