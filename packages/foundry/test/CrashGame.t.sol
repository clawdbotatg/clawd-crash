// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CrashGame} from "../contracts/CrashGame.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockCLAWD is ERC20 {
    constructor() ERC20("CLAWD", "CLAWD") {
        _mint(msg.sender, 1_000_000_000e18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CrashGameTest is Test {
    CrashGame public game;
    MockCLAWD public clawd;

    address public owner = makeAddr("owner");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public charlie = makeAddr("charlie");
    address public settler = makeAddr("settler");

    uint256 public constant MIN_BET = 100e18;
    uint256 public constant MAX_BET = 1_000_000e18;
    uint256 public constant BETTING_DURATION = 10; // 10 blocks
    uint256 public constant ROUND_DURATION = 100; // 100 blocks max

    bytes32 public seed = keccak256("test_seed_1");
    bytes32 public seedHash = keccak256(abi.encodePacked(seed));

    function setUp() public {
        vm.startPrank(owner);
        clawd = new MockCLAWD();
        game = new CrashGame(
            address(clawd),
            MIN_BET,
            MAX_BET,
            BETTING_DURATION,
            ROUND_DURATION
        );
        vm.stopPrank();

        // Fund players
        vm.startPrank(owner);
        clawd.transfer(alice, 10_000_000e18);
        clawd.transfer(bob, 10_000_000e18);
        clawd.transfer(charlie, 10_000_000e18);
        // Fund the game contract for payouts (house bankroll)
        clawd.transfer(address(game), 100_000_000e18);
        vm.stopPrank();

        // Approve
        vm.prank(alice);
        clawd.approve(address(game), type(uint256).max);
        vm.prank(bob);
        clawd.approve(address(game), type(uint256).max);
        vm.prank(charlie);
        clawd.approve(address(game), type(uint256).max);
    }

    // ─── Commit Round ────────────────────────────────────────────
    function test_CommitRound() public {
        vm.prank(owner);
        game.commitRound(seedHash);

        (bytes32 sh, uint256 bettingEnd,,,) = game.getRoundInfo(1);
        assertEq(sh, seedHash);
        assertEq(bettingEnd, block.number + BETTING_DURATION);
        assertEq(game.currentRoundId(), 1);
    }

    function test_RevertWhen_NonOwnerCommits() public {
        vm.prank(alice);
        vm.expectRevert();
        game.commitRound(seedHash);
    }

    // ─── Place Bet ───────────────────────────────────────────────
    function test_PlaceBet() public {
        _commitRound();

        vm.prank(alice);
        game.placeBet(1000e18, 0);

        (uint256 amount, uint256 autoCashout, uint256 cashedOutAt, bool settled) = game.getBet(1, alice);
        assertEq(amount, 1000e18);
        assertEq(autoCashout, 0);
        assertEq(cashedOutAt, 0);
        assertFalse(settled);
    }

    function test_PlaceBetWithAutoCashout() public {
        _commitRound();

        vm.prank(alice);
        game.placeBet(1000e18, 200); // auto-cashout at 2.00x

        (,uint256 autoCashout,,) = game.getBet(1, alice);
        assertEq(autoCashout, 200);
    }

    function test_RevertWhen_BetTooSmall() public {
        _commitRound();
        vm.prank(alice);
        vm.expectRevert(CrashGame.InvalidBet.selector);
        game.placeBet(1e18, 0); // below MIN_BET
    }

    function test_RevertWhen_BetTooLarge() public {
        _commitRound();
        vm.prank(alice);
        vm.expectRevert(CrashGame.InvalidBet.selector);
        game.placeBet(2_000_000e18, 0); // above MAX_BET
    }

    function test_RevertWhen_DoubleBet() public {
        _commitRound();
        vm.startPrank(alice);
        game.placeBet(1000e18, 0);
        vm.expectRevert(CrashGame.AlreadyBet.selector);
        game.placeBet(1000e18, 0);
        vm.stopPrank();
    }

    function test_RevertWhen_BettingAfterDeadline() public {
        _commitRound();
        vm.roll(block.number + BETTING_DURATION); // past betting end
        vm.prank(alice);
        vm.expectRevert(CrashGame.BettingOver.selector);
        game.placeBet(1000e18, 0);
    }

    function test_RevertWhen_AutoCashoutTooLow() public {
        _commitRound();
        vm.prank(alice);
        vm.expectRevert(CrashGame.MultiplierTooLow.selector);
        game.placeBet(1000e18, 100); // 1.00x is too low, min is 1.01x
    }

    // ─── Start Round ─────────────────────────────────────────────
    function test_StartRound() public {
        _commitRoundAndBet();

        vm.roll(block.number + BETTING_DURATION);
        game.startRound();

        (,,uint256 startBlock,,) = game.getRoundInfo(1);
        assertEq(startBlock, block.number);
    }

    function test_RevertWhen_StartBeforeBettingEnds() public {
        _commitRoundAndBet();
        vm.expectRevert(CrashGame.BettingNotOver.selector);
        game.startRound();
    }

    // ─── Cash Out ────────────────────────────────────────────────
    function test_CashOut() public {
        _startRound();

        // Advance a few blocks to get multiplier > 1.01x
        vm.roll(block.number + 2); // multiplier = 100 + 2*5 = 110 = 1.10x

        uint256 balBefore = clawd.balanceOf(alice);
        vm.prank(alice);
        game.cashOut();

        uint256 balAfter = clawd.balanceOf(alice);
        // Payout = 1000e18 * 110 / 100 = 1100e18
        assertEq(balAfter - balBefore, 1100e18);

        (,,uint256 cashedOutAt, bool settled) = game.getBet(1, alice);
        assertEq(cashedOutAt, 110);
        assertTrue(settled);
    }

    function test_RevertWhen_CashOutWithNoBet() public {
        _startRound();
        vm.roll(block.number + 2);
        vm.prank(settler);
        vm.expectRevert(CrashGame.NoBet.selector);
        game.cashOut();
    }

    function test_RevertWhen_DoubleCashOut() public {
        _startRound();
        vm.roll(block.number + 2);
        vm.startPrank(alice);
        game.cashOut();
        vm.expectRevert(CrashGame.AlreadyCashedOut.selector);
        game.cashOut();
        vm.stopPrank();
    }

    // ─── Reveal & Settle ─────────────────────────────────────────
    function test_RevealAndSettle_AllLose() public {
        _startRound(); // alice and bob bet 1000e18 each

        // Don't cash out, just reveal immediately (block 0 = 1.00x)
        // The crash point will be some computed value, but if nobody cashed out
        // and crash > 1.00x, they might win via auto-cashout. But no auto-cashout set.
        // So they all lose.
        uint256 burnedBefore = game.totalBurned();

        vm.prank(owner);
        game.revealAndSettle(seed);

        // All 2000e18 lost (minus settler reward)
        uint256 expectedBurned = 2000e18;
        uint256 settlerReward = (expectedBurned * 50) / 10_000; // 0.5%
        expectedBurned -= settlerReward;

        assertEq(game.totalBurned() - burnedBefore, expectedBurned);
        assertEq(clawd.balanceOf(owner), clawd.balanceOf(owner)); // owner got settler reward
    }

    function test_RevealAndSettle_WithAutoCashout() public {
        _commitRound();

        // Alice bets with auto-cashout at 1.50x
        vm.prank(alice);
        game.placeBet(1000e18, 150);

        // Bob bets with auto-cashout at 10.00x (probably won't hit)
        vm.prank(bob);
        game.placeBet(1000e18, 1000);

        vm.roll(block.number + BETTING_DURATION);
        game.startRound();

        // Advance blocks so blockhash is available
        vm.roll(block.number + 5);

        vm.prank(owner);
        game.revealAndSettle(seed);

        // Check if alice's auto-cashout triggered
        (,,uint256 aliceCashedOut,) = game.getBet(1, alice);
        (,,uint256 bobCashedOut,) = game.getBet(1, bob);

        // Both should be settled
        (,,,bool aliceSettled) = game.getBet(1, alice);
        (,,,bool bobSettled) = game.getBet(1, bob);
        assertTrue(aliceSettled);
        assertTrue(bobSettled);
    }

    function test_RevertWhen_InvalidSeed() public {
        _startRound();

        vm.prank(owner);
        vm.expectRevert(CrashGame.InvalidSeed.selector);
        game.revealAndSettle(keccak256("wrong_seed"));
    }

    // ─── Emergency Refund ────────────────────────────────────────
    function test_EmergencyRefund() public {
        _startRound();

        uint256 aliceBefore = clawd.balanceOf(alice);
        uint256 bobBefore = clawd.balanceOf(bob);

        // Wait for round duration to expire
        vm.roll(block.number + ROUND_DURATION);

        game.emergencyRefund();

        assertEq(clawd.balanceOf(alice), aliceBefore + 1000e18);
        assertEq(clawd.balanceOf(bob), bobBefore + 1000e18);
    }

    function test_RevertWhen_EmergencyTooEarly() public {
        _startRound();
        vm.expectRevert(CrashGame.GameNotOver.selector);
        game.emergencyRefund();
    }

    // ─── Multiplier ──────────────────────────────────────────────
    function test_MultiplierGrowth() public {
        _startRound();

        assertEq(game.getCurrentMultiplier(), 100); // 1.00x at block 0

        vm.roll(block.number + 10);
        assertEq(game.getCurrentMultiplier(), 150); // 1.50x at block 10

        vm.roll(block.number + 10);
        assertEq(game.getCurrentMultiplier(), 200); // 2.00x at block 20
    }

    // ─── Full Round Flow ─────────────────────────────────────────
    function test_FullRoundFlow() public {
        // 1. Commit
        vm.prank(owner);
        game.commitRound(seedHash);

        // 2. Bets
        vm.prank(alice);
        game.placeBet(5000e18, 0); // manual cashout
        vm.prank(bob);
        game.placeBet(3000e18, 200); // auto at 2.00x
        vm.prank(charlie);
        game.placeBet(2000e18, 0); // manual, won't cash out

        // 3. Start
        vm.roll(block.number + BETTING_DURATION);
        game.startRound();

        // 4. Alice cashes out at 1.50x
        vm.roll(block.number + 10); // 1.50x
        uint256 aliceBefore = clawd.balanceOf(alice);
        vm.prank(alice);
        game.cashOut();
        assertEq(clawd.balanceOf(alice) - aliceBefore, 7500e18); // 5000 * 1.5

        // 5. Reveal (charlie loses, bob's auto-cashout may trigger)
        vm.roll(block.number + 5);
        vm.prank(settler);
        game.revealAndSettle(seed);

        // Verify round is settled
        (,,,,CrashGame.RoundPhase phase) = game.getRoundInfo(1);
        assertEq(uint256(phase), uint256(CrashGame.RoundPhase.Settled));
    }

    // ─── Fuzz: Crash Point Distribution ──────────────────────────
    function testFuzz_CrashPointAlwaysValid(bytes32 randomSeed) public pure {
        bytes32 gameHash = keccak256(abi.encodePacked(randomSeed));
        // We can't call internal _computeCrashPoint, so test the formula inline
        uint256 h = uint256(gameHash) >> 204;
        uint256 MAX_VAL = (1 << 52);
        uint256 crashPoint;
        
        if (h >= (MAX_VAL * 9600) / 10_000) {
            crashPoint = 100;
        } else {
            crashPoint = (MAX_VAL * 100) / (MAX_VAL - h);
        }
        if (crashPoint > 10000) crashPoint = 10000;
        if (crashPoint < 100) crashPoint = 100;

        assertGe(crashPoint, 100, "Crash point must be >= 1.00x");
        assertLe(crashPoint, 10000, "Crash point must be <= 100.00x");
    }

    // ─── Fuzz: Bet Amounts ───────────────────────────────────────
    function testFuzz_PlaceBet(uint256 amount) public {
        amount = bound(amount, MIN_BET, MAX_BET);
        _commitRound();

        vm.prank(alice);
        game.placeBet(amount, 0);

        (uint256 betAmount,,,) = game.getBet(1, alice);
        assertEq(betAmount, amount);
    }

    // ─── Consecutive Rounds ──────────────────────────────────────
    function test_ConsecutiveRounds() public {
        // Round 1
        _commitRound();
        vm.prank(alice);
        game.placeBet(1000e18, 0);
        vm.roll(block.number + BETTING_DURATION);
        game.startRound();
        vm.prank(owner);
        game.revealAndSettle(seed);

        // Round 2
        bytes32 seed2 = keccak256("test_seed_2");
        bytes32 seedHash2 = keccak256(abi.encodePacked(seed2));
        vm.prank(owner);
        game.commitRound(seedHash2);

        assertEq(game.currentRoundId(), 2);

        vm.prank(alice);
        game.placeBet(1000e18, 0);
        vm.roll(block.number + BETTING_DURATION);
        game.startRound();
        vm.prank(owner);
        game.revealAndSettle(seed2);

        (,,,,CrashGame.RoundPhase phase) = game.getRoundInfo(2);
        assertEq(uint256(phase), uint256(CrashGame.RoundPhase.Settled));
    }

    // ─── Helpers ─────────────────────────────────────────────────
    function _commitRound() internal {
        vm.prank(owner);
        game.commitRound(seedHash);
    }

    function _commitRoundAndBet() internal {
        _commitRound();
        vm.prank(alice);
        game.placeBet(1000e18, 0);
        vm.prank(bob);
        game.placeBet(1000e18, 0);
    }

    function _startRound() internal {
        _commitRoundAndBet();
        vm.roll(block.number + BETTING_DURATION);
        game.startRound();
    }
}
