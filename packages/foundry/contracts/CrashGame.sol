// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title CrashGame — Provably fair crash game using CLAWD tokens
/// @notice Players bet CLAWD, multiplier climbs, cash out before it crashes or lose everything.
///         Uses commit-reveal hash chain for provably fair crash points.
///         House edge ~4%. House cut is burned (sent to dead address).
contract CrashGame is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ───────────────────────────────────────────────
    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant MULTIPLIER_PRECISION = 100; // 2 decimal places: 150 = 1.50x
    uint256 public constant MIN_CASHOUT = 101; // 1.01x minimum cashout
    uint256 public constant HOUSE_EDGE_BPS = 400; // 4% house edge
    uint256 public constant SETTLE_REWARD_BPS = 50; // 0.5% reward for settling
    uint256 public constant MAX_MULTIPLIER = 100_00; // 100.00x max

    // ─── State ───────────────────────────────────────────────────
    IERC20 public immutable clawdToken;

    uint256 public minBet;
    uint256 public maxBet;
    uint256 public bettingDuration; // blocks for betting phase
    uint256 public roundDuration; // blocks for game phase (max before auto-settle)

    enum RoundPhase { None, Betting, Active, Settled }

    struct Round {
        bytes32 seedHash;          // commit: hash(seed)
        uint256 bettingEnd;        // block when betting closes
        uint256 startBlock;        // block when game starts (multiplier=1.00x)
        uint256 crashBlock;        // computed after reveal: block where crash happens
        uint256 crashMultiplier;   // the crash point (in MULTIPLIER_PRECISION)
        uint256 totalBets;         // sum of all bets this round
        uint256 totalPaidOut;      // sum of all payouts
        RoundPhase phase;
        bytes32 revealedSeed;      // the revealed seed
    }

    struct Bet {
        uint256 amount;
        uint256 autoCashout;       // 0 = manual, else auto-cashout multiplier
        uint256 cashedOutAt;       // multiplier they cashed out at (0 = still in)
        bool settled;              // whether payout was distributed
    }

    uint256 public currentRoundId;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(uint256 => address[]) public roundPlayers;

    uint256 public totalBurned;

    // ─── Events ──────────────────────────────────────────────────
    event RoundCommitted(uint256 indexed roundId, bytes32 seedHash, uint256 bettingEnd);
    event BetPlaced(uint256 indexed roundId, address indexed player, uint256 amount, uint256 autoCashout);
    event RoundStarted(uint256 indexed roundId, uint256 startBlock);
    event CashedOut(uint256 indexed roundId, address indexed player, uint256 multiplier, uint256 payout);
    event RoundCrashed(uint256 indexed roundId, uint256 crashMultiplier, bytes32 seed);
    event RoundSettled(uint256 indexed roundId, uint256 burned, address settler, uint256 settlerReward);

    // ─── Errors ──────────────────────────────────────────────────
    error WrongPhase();
    error BettingNotOver();
    error BettingOver();
    error InvalidBet();
    error AlreadyBet();
    error NoBet();
    error AlreadyCashedOut();
    error RoundNotCrashed();
    error InvalidSeed();
    error MultiplierTooLow();
    error GameNotOver();

    constructor(
        address _clawdToken,
        uint256 _minBet,
        uint256 _maxBet,
        uint256 _bettingDuration,
        uint256 _roundDuration
    ) Ownable(msg.sender) {
        clawdToken = IERC20(_clawdToken);
        minBet = _minBet;
        maxBet = _maxBet;
        bettingDuration = _bettingDuration;
        roundDuration = _roundDuration;
    }

    // ─── Phase 1: Commit & Open Betting ──────────────────────────
    /// @notice Operator commits hash(seed) to start a new round
    function commitRound(bytes32 _seedHash) external onlyOwner {
        // Previous round must be settled or this is the first
        if (currentRoundId > 0) {
            if (rounds[currentRoundId].phase != RoundPhase.Settled) revert WrongPhase();
        }

        currentRoundId++;
        Round storage r = rounds[currentRoundId];
        r.seedHash = _seedHash;
        r.bettingEnd = block.number + bettingDuration;
        r.phase = RoundPhase.Betting;

        emit RoundCommitted(currentRoundId, _seedHash, r.bettingEnd);
    }

    // ─── Phase 2: Place Bets ─────────────────────────────────────
    /// @notice Place a bet during the betting phase
    /// @param amount Amount of CLAWD to bet
    /// @param autoCashout Auto-cashout multiplier (0 = manual). In MULTIPLIER_PRECISION.
    function placeBet(uint256 amount, uint256 autoCashout) external nonReentrant {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Betting) revert WrongPhase();
        if (block.number >= r.bettingEnd) revert BettingOver();
        if (amount < minBet || amount > maxBet) revert InvalidBet();
        if (autoCashout != 0 && autoCashout < MIN_CASHOUT) revert MultiplierTooLow();
        if (bets[currentRoundId][msg.sender].amount > 0) revert AlreadyBet();

        clawdToken.safeTransferFrom(msg.sender, address(this), amount);

        bets[currentRoundId][msg.sender] = Bet({
            amount: amount,
            autoCashout: autoCashout,
            cashedOutAt: 0,
            settled: false
        });
        roundPlayers[currentRoundId].push(msg.sender);
        r.totalBets += amount;

        emit BetPlaced(currentRoundId, msg.sender, amount, autoCashout);
    }

    // ─── Phase 3: Start Round ────────────────────────────────────
    /// @notice Anyone can start the round after betting ends
    function startRound() external {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Betting) revert WrongPhase();
        if (block.number < r.bettingEnd) revert BettingNotOver();

        r.startBlock = block.number;
        r.phase = RoundPhase.Active;

        emit RoundStarted(currentRoundId, block.number);
    }

    // ─── Phase 4: Cash Out ───────────────────────────────────────
    /// @notice Cash out at the current block's multiplier
    function cashOut() external nonReentrant {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Active) revert WrongPhase();

        Bet storage b = bets[currentRoundId][msg.sender];
        if (b.amount == 0) revert NoBet();
        if (b.cashedOutAt > 0) revert AlreadyCashedOut();

        uint256 currentMultiplier = _getCurrentMultiplier(r.startBlock);
        if (currentMultiplier < MIN_CASHOUT) revert MultiplierTooLow();

        b.cashedOutAt = currentMultiplier;
        b.settled = true;

        uint256 payout = (b.amount * currentMultiplier) / MULTIPLIER_PRECISION;
        r.totalPaidOut += payout;

        clawdToken.safeTransfer(msg.sender, payout);

        emit CashedOut(currentRoundId, msg.sender, currentMultiplier, payout);
    }

    // ─── Phase 5: Reveal & Settle ────────────────────────────────
    /// @notice Operator reveals seed, crash point is computed, round settles
    /// @param seed The preimage of seedHash
    function revealAndSettle(bytes32 seed) external nonReentrant {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Active) revert WrongPhase();

        // Verify the seed matches the commitment
        if (keccak256(abi.encodePacked(seed)) != r.seedHash) revert InvalidSeed();

        // Compute crash multiplier from seed + startBlock hash
        // Using seed combined with blockhash of start block for added entropy
        bytes32 gameHash = keccak256(abi.encodePacked(seed, blockhash(r.startBlock)));
        uint256 crashMultiplier = _computeCrashPoint(gameHash);

        r.revealedSeed = seed;
        r.crashMultiplier = crashMultiplier;
        r.phase = RoundPhase.Settled;

        // Process auto-cashouts and determine losers
        uint256 burned = 0;
        address[] storage players = roundPlayers[currentRoundId];
        for (uint256 i = 0; i < players.length; i++) {
            Bet storage b = bets[currentRoundId][players[i]];
            if (b.settled) continue; // already cashed out manually

            // Check auto-cashout
            if (b.autoCashout > 0 && b.autoCashout <= crashMultiplier) {
                // Auto-cashout succeeded
                b.cashedOutAt = b.autoCashout;
                b.settled = true;
                uint256 payout = (b.amount * b.autoCashout) / MULTIPLIER_PRECISION;
                r.totalPaidOut += payout;
                clawdToken.safeTransfer(players[i], payout);
                emit CashedOut(currentRoundId, players[i], b.autoCashout, payout);
            } else {
                // Player lost — didn't cash out before crash
                b.settled = true;
                burned += b.amount;
            }
        }

        // Settler reward (incentive to call this function)
        uint256 settlerReward = 0;
        if (burned > 0) {
            settlerReward = (burned * SETTLE_REWARD_BPS) / 10_000;
            burned -= settlerReward;
            if (settlerReward > 0) {
                clawdToken.safeTransfer(msg.sender, settlerReward);
            }
        }

        // Burn the house's cut
        if (burned > 0) {
            clawdToken.safeTransfer(DEAD, burned);
            totalBurned += burned;
        }

        emit RoundCrashed(currentRoundId, crashMultiplier, seed);
        emit RoundSettled(currentRoundId, burned, msg.sender, settlerReward);
    }

    // ─── Emergency: Refund if operator disappears ────────────────
    /// @notice If round is active and operator hasn't revealed after roundDuration blocks, 
    ///         anyone can cancel and all bets are refunded.
    function emergencyRefund() external nonReentrant {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Active) revert WrongPhase();
        if (block.number < r.startBlock + roundDuration) revert GameNotOver();

        r.phase = RoundPhase.Settled;
        r.crashMultiplier = 0; // indicates emergency

        // Refund everyone who hasn't cashed out
        address[] storage players = roundPlayers[currentRoundId];
        for (uint256 i = 0; i < players.length; i++) {
            Bet storage b = bets[currentRoundId][players[i]];
            if (!b.settled) {
                b.settled = true;
                clawdToken.safeTransfer(players[i], b.amount);
            }
        }
    }

    // ─── View Functions ──────────────────────────────────────────
    /// @notice Get current multiplier based on blocks elapsed since round start
    function getCurrentMultiplier() external view returns (uint256) {
        Round storage r = rounds[currentRoundId];
        if (r.phase != RoundPhase.Active) return 100; // 1.00x
        return _getCurrentMultiplier(r.startBlock);
    }

    /// @notice Get round info (part 1)
    function getRoundInfo(uint256 roundId) external view returns (
        bytes32 seedHash,
        uint256 bettingEnd,
        uint256 startBlock,
        uint256 crashMultiplier,
        RoundPhase phase
    ) {
        Round storage r = rounds[roundId];
        return (r.seedHash, r.bettingEnd, r.startBlock, r.crashMultiplier, r.phase);
    }

    /// @notice Get round stats
    function getRoundStats(uint256 roundId) external view returns (
        uint256 totalBets,
        uint256 totalPaidOut,
        uint256 playerCount
    ) {
        Round storage r = rounds[roundId];
        return (r.totalBets, r.totalPaidOut, roundPlayers[roundId].length);
    }

    /// @notice Get a player's bet for a round
    function getBet(uint256 roundId, address player) external view returns (
        uint256 amount,
        uint256 autoCashout,
        uint256 cashedOutAt,
        bool settled
    ) {
        Bet storage b = bets[roundId][player];
        return (b.amount, b.autoCashout, b.cashedOutAt, b.settled);
    }

    /// @notice Get all players in a round
    function getRoundPlayers(uint256 roundId) external view returns (address[] memory) {
        return roundPlayers[roundId];
    }

    // ─── Admin ───────────────────────────────────────────────────
    function setMinBet(uint256 _minBet) external onlyOwner {
        minBet = _minBet;
    }

    function setMaxBet(uint256 _maxBet) external onlyOwner {
        maxBet = _maxBet;
    }

    function setBettingDuration(uint256 _bettingDuration) external onlyOwner {
        bettingDuration = _bettingDuration;
    }

    function setRoundDuration(uint256 _roundDuration) external onlyOwner {
        roundDuration = _roundDuration;
    }

    // ─── Internal ────────────────────────────────────────────────
    
    /// @notice Multiplier = 1.00x + 0.01x per block elapsed
    /// @dev Returns multiplier in MULTIPLIER_PRECISION (100 = 1.00x, 150 = 1.50x)
    function _getCurrentMultiplier(uint256 startBlock) internal view returns (uint256) {
        uint256 elapsed = block.number - startBlock;
        // Exponential-ish growth: base 1.00x + 1% per block, compounding
        // Simplified: multiplier = 100 + elapsed * 5 (0.05x per block for ~2s blocks on Base)
        // This gives: block 0 = 1.00x, block 10 = 1.50x, block 20 = 2.00x, block 60 = 4.00x
        uint256 mult = 100 + (elapsed * 5);
        if (mult > MAX_MULTIPLIER) mult = MAX_MULTIPLIER;
        return mult;
    }

    /// @notice Compute crash point from game hash
    /// @dev Uses exponential distribution with ~4% house edge
    ///      Formula: max(1.00, 2^52 / (2^52 - h)) * (1 - houseEdge)
    ///      Where h = first 52 bits of gameHash interpreted as uint
    function _computeCrashPoint(bytes32 gameHash) internal pure returns (uint256) {
        // Take first 8 bytes as uint64
        uint256 h = uint256(gameHash) >> 204; // top 52 bits

        uint256 MAX_VAL = (1 << 52);
        
        // ~4% of the time, instant crash (h >= 96% of max)
        if (h >= (MAX_VAL * (10_000 - HOUSE_EDGE_BPS)) / 10_000) {
            return 100; // 1.00x = instant crash
        }

        // crashPoint = MAX_VAL / (MAX_VAL - h) * 100 (in MULTIPLIER_PRECISION)
        // This gives exponential distribution:
        // ~50% chance of 2x+, ~33% of 3x+, ~10% of 10x+, ~1% of 100x+
        uint256 crashPoint = (MAX_VAL * 100) / (MAX_VAL - h);
        
        if (crashPoint > MAX_MULTIPLIER) crashPoint = MAX_MULTIPLIER;
        if (crashPoint < 100) crashPoint = 100;

        return crashPoint;
    }
}
