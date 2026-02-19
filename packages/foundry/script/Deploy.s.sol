//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { DeployCrashGame } from "./DeployCrashGame.s.sol";

contract DeployScript is ScaffoldETHDeploy {
  function run() external {
    DeployCrashGame deployCrashGame = new DeployCrashGame();
    deployCrashGame.run();
  }
}
