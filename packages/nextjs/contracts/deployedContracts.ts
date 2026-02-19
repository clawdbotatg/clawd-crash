import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  8453: {
    CrashGame: {
      address: "0x4CA44BDb94549301cB81C54599f230313f0Eebd5",
      abi: [
        {
          type: "constructor",
          inputs: [
            {
              name: "_clawdToken",
              type: "address",
              internalType: "address",
            },
            {
              name: "_minBet",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_maxBet",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_bettingDuration",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "_roundDuration",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "DEAD",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "HOUSE_EDGE_BPS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MAX_MULTIPLIER",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MIN_CASHOUT",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "MULTIPLIER_PRECISION",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "SETTLE_REWARD_BPS",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "bets",
          inputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "autoCashout",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "cashedOutAt",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "settled",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "bettingDuration",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "cashOut",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "clawdToken",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "contract IERC20",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "commitRound",
          inputs: [
            {
              name: "_seedHash",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "currentRoundId",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "emergencyRefund",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "getBet",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "autoCashout",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "cashedOutAt",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "settled",
              type: "bool",
              internalType: "bool",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getCurrentMultiplier",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getRoundInfo",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "seedHash",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "bettingEnd",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "startBlock",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "crashMultiplier",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "phase",
              type: "uint8",
              internalType: "enum CrashGame.RoundPhase",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getRoundPlayers",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "address[]",
              internalType: "address[]",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "getRoundStats",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "totalBets",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "totalPaidOut",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "playerCount",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "maxBet",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "minBet",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "owner",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "placeBet",
          inputs: [
            {
              name: "amount",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "autoCashout",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "renounceOwnership",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "revealAndSettle",
          inputs: [
            {
              name: "seed",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "roundDuration",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "roundPlayers",
          inputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "",
              type: "address",
              internalType: "address",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "rounds",
          inputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [
            {
              name: "seedHash",
              type: "bytes32",
              internalType: "bytes32",
            },
            {
              name: "bettingEnd",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "startBlock",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "crashBlock",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "crashMultiplier",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "totalBets",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "totalPaidOut",
              type: "uint256",
              internalType: "uint256",
            },
            {
              name: "phase",
              type: "uint8",
              internalType: "enum CrashGame.RoundPhase",
            },
            {
              name: "revealedSeed",
              type: "bytes32",
              internalType: "bytes32",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "setBettingDuration",
          inputs: [
            {
              name: "_bettingDuration",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "setMaxBet",
          inputs: [
            {
              name: "_maxBet",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "setMinBet",
          inputs: [
            {
              name: "_minBet",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "setRoundDuration",
          inputs: [
            {
              name: "_roundDuration",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "startRound",
          inputs: [],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "function",
          name: "totalBurned",
          inputs: [],
          outputs: [
            {
              name: "",
              type: "uint256",
              internalType: "uint256",
            },
          ],
          stateMutability: "view",
        },
        {
          type: "function",
          name: "transferOwnership",
          inputs: [
            {
              name: "newOwner",
              type: "address",
              internalType: "address",
            },
          ],
          outputs: [],
          stateMutability: "nonpayable",
        },
        {
          type: "event",
          name: "BetPlaced",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "amount",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "autoCashout",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "CashedOut",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "player",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "multiplier",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "payout",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "OwnershipTransferred",
          inputs: [
            {
              name: "previousOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
            {
              name: "newOwner",
              type: "address",
              indexed: true,
              internalType: "address",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoundCommitted",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "seedHash",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
            {
              name: "bettingEnd",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoundCrashed",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "crashMultiplier",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "seed",
              type: "bytes32",
              indexed: false,
              internalType: "bytes32",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoundSettled",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "burned",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
            {
              name: "settler",
              type: "address",
              indexed: false,
              internalType: "address",
            },
            {
              name: "settlerReward",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "event",
          name: "RoundStarted",
          inputs: [
            {
              name: "roundId",
              type: "uint256",
              indexed: true,
              internalType: "uint256",
            },
            {
              name: "startBlock",
              type: "uint256",
              indexed: false,
              internalType: "uint256",
            },
          ],
          anonymous: false,
        },
        {
          type: "error",
          name: "AlreadyBet",
          inputs: [],
        },
        {
          type: "error",
          name: "AlreadyCashedOut",
          inputs: [],
        },
        {
          type: "error",
          name: "BettingNotOver",
          inputs: [],
        },
        {
          type: "error",
          name: "BettingOver",
          inputs: [],
        },
        {
          type: "error",
          name: "GameNotOver",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidBet",
          inputs: [],
        },
        {
          type: "error",
          name: "InvalidSeed",
          inputs: [],
        },
        {
          type: "error",
          name: "MultiplierTooLow",
          inputs: [],
        },
        {
          type: "error",
          name: "NoBet",
          inputs: [],
        },
        {
          type: "error",
          name: "OwnableInvalidOwner",
          inputs: [
            {
              name: "owner",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "OwnableUnauthorizedAccount",
          inputs: [
            {
              name: "account",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "ReentrancyGuardReentrantCall",
          inputs: [],
        },
        {
          type: "error",
          name: "RoundNotCrashed",
          inputs: [],
        },
        {
          type: "error",
          name: "SafeERC20FailedOperation",
          inputs: [
            {
              name: "token",
              type: "address",
              internalType: "address",
            },
          ],
        },
        {
          type: "error",
          name: "WrongPhase",
          inputs: [],
        },
      ],
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;
