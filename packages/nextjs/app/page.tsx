"use client";

import { useCallback, useEffect, useState } from "react";
import { Address } from "@scaffold-ui/components";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

// Phase enum matching contract
const PHASE = { None: 0, Betting: 1, Active: 2, Settled: 3 } as const;
const PHASE_LABELS: Record<number, string> = {
  0: "Waiting",
  1: "🎯 Place Your Bets",
  2: "🚀 LIVE — Cash Out!",
  3: "💥 Round Over",
};

function MultiplierDisplay({ multiplier, crashed }: { multiplier: number; crashed: boolean }) {
  const color = crashed
    ? "text-red-500"
    : multiplier >= 3
      ? "text-green-400"
      : multiplier >= 2
        ? "text-yellow-400"
        : "text-white";

  return (
    <div className={`text-center py-8 ${crashed ? "animate-pulse" : ""}`}>
      <div className={`text-7xl font-black tabular-nums ${color} transition-colors duration-200`}>
        {multiplier.toFixed(2)}x
      </div>
      {crashed && <div className="text-red-500 text-2xl font-bold mt-2">CRASHED!</div>}
    </div>
  );
}

function BetForm({
  onPlaceBet,
  isApproving,
  isBetting,
  needsApproval,
  minBet,
  maxBet,
  balance,
  phase,
}: {
  onPlaceBet: (amount: string, autoCashout: string) => void;
  isApproving: boolean;
  isBetting: boolean;
  needsApproval: boolean;
  minBet: bigint;
  maxBet: bigint;
  balance: bigint;
  phase: number;
}) {
  const [amount, setAmount] = useState("1000");
  const [autoCashout, setAutoCashout] = useState("");

  const disabled = phase !== PHASE.Betting;

  return (
    <div className="bg-base-200 rounded-xl p-4 space-y-3">
      <div>
        <label className="text-sm opacity-70">Bet Amount (CLAWD)</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="input input-bordered w-full"
          placeholder="1000"
          disabled={disabled}
        />
        <div className="text-xs opacity-50 mt-1">
          Balance: {balance ? Number(formatEther(balance)).toLocaleString() : "0"} CLAWD
          {" · "}Min: {Number(formatEther(minBet)).toLocaleString()} · Max:{" "}
          {Number(formatEther(maxBet)).toLocaleString()}
        </div>
      </div>
      <div>
        <label className="text-sm opacity-70">Auto Cash Out (optional)</label>
        <input
          type="number"
          value={autoCashout}
          onChange={e => setAutoCashout(e.target.value)}
          className="input input-bordered w-full"
          placeholder="e.g. 2.00"
          step="0.01"
          disabled={disabled}
        />
        <div className="text-xs opacity-50 mt-1">Leave empty for manual cash out</div>
      </div>
      {disabled ? (
        <button className="btn btn-disabled w-full" disabled>
          Betting Closed
        </button>
      ) : needsApproval ? (
        <button
          className="btn btn-warning w-full"
          disabled={isApproving}
          onClick={() => onPlaceBet(amount, autoCashout)}
        >
          {isApproving ? <span className="loading loading-spinner loading-sm" /> : "Approve CLAWD"}
        </button>
      ) : (
        <button className="btn btn-primary w-full" disabled={isBetting} onClick={() => onPlaceBet(amount, autoCashout)}>
          {isBetting ? <span className="loading loading-spinner loading-sm" /> : `Bet ${amount} CLAWD`}
        </button>
      )}
    </div>
  );
}

export default function CrashGamePage() {
  const { address, isConnected, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const wrongNetwork = chain?.id !== targetNetwork.id;

  const [isApproving, setIsApproving] = useState(false);
  const [isBetting, setIsBetting] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [displayMultiplier, setDisplayMultiplier] = useState(1.0);

  // Contract info
  const { data: contractInfo } = useDeployedContractInfo("CrashGame");

  // Read contract state
  const { data: currentRoundId } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "currentRoundId",
    watch: true,
  });

  const { data: roundInfo } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "getRoundInfo",
    args: [currentRoundId || 0n],
    watch: true,
  });

  const { data: roundStats } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "getRoundStats",
    args: [currentRoundId || 0n],
    watch: true,
  });

  const { data: currentMultiplier } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "getCurrentMultiplier",
    watch: true,
  });

  const { data: myBet } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "getBet",
    args: [currentRoundId || 0n, address],
    watch: true,
  });

  const { data: minBet } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "minBet",
  });

  const { data: maxBet } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "maxBet",
  });

  const { data: totalBurned } = useScaffoldReadContract({
    contractName: "CrashGame",
    functionName: "totalBurned",
    watch: true,
  });

  // CLAWD balance & allowance
  const { data: clawdBalance } = useScaffoldReadContract({
    contractName: "CLAWDToken",
    functionName: "balanceOf",
    args: [address],
    watch: true,
  });

  const { data: allowance } = useScaffoldReadContract({
    contractName: "CLAWDToken",
    functionName: "allowance",
    args: [address, contractInfo?.address],
    watch: true,
  });

  // Recent crash events
  const { data: crashEvents } = useScaffoldEventHistory({
    contractName: "CrashGame",
    eventName: "RoundCrashed",
    fromBlock: 42380000n,
    watch: true,
  });

  // Write hooks
  const { writeContractAsync: writeApprove } = useScaffoldWriteContract("CLAWDToken");
  const { writeContractAsync: writeCrashGame } = useScaffoldWriteContract("CrashGame");

  // Parse round info
  const phase = roundInfo ? Number(roundInfo[4]) : 0;
  const crashMultiplier = roundInfo ? Number(roundInfo[3]) : 0;
  const totalBets = roundStats ? roundStats[0] : 0n;
  const playerCount = roundStats ? Number(roundStats[2]) : 0;

  // My bet info
  const myBetAmount = myBet ? myBet[0] : 0n;
  const myAutoCashout = myBet ? Number(myBet[1]) : 0;
  const myCashedOutAt = myBet ? Number(myBet[2]) : 0;
  const _mySettled = myBet ? myBet[3] : false;
  const hasBet = myBetAmount > 0n;

  // Animated multiplier
  useEffect(() => {
    if (phase === PHASE.Active && currentMultiplier) {
      const target = Number(currentMultiplier) / 100;
      // Smooth animation
      const interval = setInterval(() => {
        setDisplayMultiplier(prev => {
          const diff = target - prev;
          if (Math.abs(diff) < 0.01) return target;
          return prev + diff * 0.3;
        });
      }, 50);
      return () => clearInterval(interval);
    } else if (phase === PHASE.Settled && crashMultiplier > 0) {
      setDisplayMultiplier(crashMultiplier / 100);
    } else {
      setDisplayMultiplier(1.0);
    }
  }, [phase, currentMultiplier, crashMultiplier]);

  // Determine if approval needed
  const needsApproval = useCallback(
    (amount: string) => {
      if (!allowance) return true;
      try {
        return allowance < parseEther(amount || "0");
      } catch {
        return true;
      }
    },
    [allowance],
  );

  const [betAmount, setBetAmount] = useState("1000");

  // Place bet handler
  const handlePlaceBet = async (amount: string, autoCashout: string) => {
    if (!amount) return;
    setBetAmount(amount);
    const amountWei = parseEther(amount);

    if (needsApproval(amount)) {
      setIsApproving(true);
      try {
        await writeApprove({
          functionName: "approve",
          args: [contractInfo?.address, amountWei * 5n], // 5x approval for convenience
        });
      } catch (e) {
        console.error("Approve failed:", e);
      } finally {
        setIsApproving(false);
      }
      return;
    }

    setIsBetting(true);
    try {
      const autoCashoutVal = autoCashout ? BigInt(Math.round(parseFloat(autoCashout) * 100)) : 0n;
      await writeCrashGame({
        functionName: "placeBet",
        args: [amountWei, autoCashoutVal],
      });
    } catch (e) {
      console.error("Bet failed:", e);
    } finally {
      setIsBetting(false);
    }
  };

  // Cash out handler
  const handleCashOut = async () => {
    setIsCashingOut(true);
    try {
      await writeCrashGame({ functionName: "cashOut" });
    } catch (e) {
      console.error("Cash out failed:", e);
    } finally {
      setIsCashingOut(false);
    }
  };

  // Start round handler (anyone can call)
  const handleStartRound = async () => {
    setIsStarting(true);
    try {
      await writeCrashGame({ functionName: "startRound" });
    } catch (e) {
      console.error("Start failed:", e);
    } finally {
      setIsStarting(false);
    }
  };

  // Recent history
  const recentCrashes = (crashEvents || []).slice(-10).reverse();

  return (
    <div className="flex flex-col items-center px-4 py-6 gap-6 max-w-4xl mx-auto">
      {/* Game Display */}
      <div className="w-full bg-base-300 rounded-2xl overflow-hidden">
        {/* Status Bar */}
        <div className="flex justify-between items-center px-4 py-2 bg-base-200">
          <span className="font-mono text-sm">Round #{currentRoundId?.toString() || "—"}</span>
          <span
            className={`badge ${
              phase === PHASE.Betting
                ? "badge-warning"
                : phase === PHASE.Active
                  ? "badge-success"
                  : phase === PHASE.Settled
                    ? "badge-error"
                    : "badge-ghost"
            }`}
          >
            {PHASE_LABELS[phase] || "—"}
          </span>
          <span className="text-sm opacity-70">
            {playerCount} player{playerCount !== 1 ? "s" : ""} ·{" "}
            {totalBets ? Number(formatEther(totalBets)).toLocaleString() : "0"} CLAWD
          </span>
        </div>

        {/* Multiplier */}
        <div className="bg-gradient-to-b from-base-300 to-base-100 min-h-[200px] flex items-center justify-center">
          <MultiplierDisplay multiplier={displayMultiplier} crashed={phase === PHASE.Settled && crashMultiplier > 0} />
        </div>

        {/* Crash History Bar */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto bg-base-200">
          {recentCrashes.map((event, i) => {
            const mult = Number(event.args.crashMultiplier || 0) / 100;
            return (
              <span
                key={i}
                className={`badge badge-sm font-mono ${
                  mult >= 2 ? "badge-success" : mult >= 1.5 ? "badge-warning" : "badge-error"
                }`}
              >
                {mult.toFixed(2)}x
              </span>
            );
          })}
          {recentCrashes.length === 0 && <span className="text-sm opacity-50">No rounds yet</span>}
        </div>
      </div>

      {/* Action Area */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Bet / Cash Out */}
        <div className="space-y-3">
          {!isConnected ? (
            <div className="bg-base-200 rounded-xl p-6 text-center">
              <RainbowKitCustomConnectButton />
            </div>
          ) : wrongNetwork ? (
            <div className="bg-base-200 rounded-xl p-6 text-center">
              <button className="btn btn-warning w-full" onClick={() => {}}>
                Switch to {targetNetwork.name}
              </button>
            </div>
          ) : phase === PHASE.Active && hasBet && !myCashedOutAt ? (
            <div className="bg-base-200 rounded-xl p-6">
              <div className="text-center mb-3">
                <div className="text-sm opacity-70">Your Bet</div>
                <div className="text-xl font-bold">{Number(formatEther(myBetAmount)).toLocaleString()} CLAWD</div>
                {myAutoCashout > 0 && (
                  <div className="text-sm text-warning">Auto cashout: {(myAutoCashout / 100).toFixed(2)}x</div>
                )}
                <div className="text-sm text-green-400 mt-1">
                  Potential:{" "}
                  {(Number(formatEther(myBetAmount)) * displayMultiplier).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  CLAWD
                </div>
              </div>
              <button
                className="btn btn-success btn-lg w-full animate-pulse"
                disabled={isCashingOut}
                onClick={handleCashOut}
              >
                {isCashingOut ? (
                  <span className="loading loading-spinner" />
                ) : (
                  `💰 CASH OUT ${displayMultiplier.toFixed(2)}x`
                )}
              </button>
            </div>
          ) : phase === PHASE.Active && hasBet && myCashedOutAt > 0 ? (
            <div className="bg-base-200 rounded-xl p-6 text-center">
              <div className="text-green-400 text-2xl font-bold">
                ✅ Cashed out at {(myCashedOutAt / 100).toFixed(2)}x
              </div>
              <div className="text-lg mt-1">
                Won{" "}
                {((Number(formatEther(myBetAmount)) * myCashedOutAt) / 100).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                CLAWD
              </div>
            </div>
          ) : phase === PHASE.Settled && hasBet ? (
            <div className="bg-base-200 rounded-xl p-6 text-center">
              {myCashedOutAt > 0 ? (
                <>
                  <div className="text-green-400 text-2xl font-bold">
                    🎉 Won at {(myCashedOutAt / 100).toFixed(2)}x!
                  </div>
                  <div className="text-lg">
                    +
                    {(
                      (Number(formatEther(myBetAmount)) * myCashedOutAt) / 100 -
                      Number(formatEther(myBetAmount))
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}{" "}
                    CLAWD profit
                  </div>
                </>
              ) : (
                <div className="text-red-500 text-2xl font-bold">
                  💀 Busted! Lost {Number(formatEther(myBetAmount)).toLocaleString()} CLAWD
                </div>
              )}
            </div>
          ) : (
            <BetForm
              onPlaceBet={handlePlaceBet}
              isApproving={isApproving}
              isBetting={isBetting}
              needsApproval={needsApproval(betAmount)}
              minBet={minBet || 0n}
              maxBet={maxBet || 0n}
              balance={clawdBalance || 0n}
              phase={phase}
            />
          )}

          {/* Start Round button (anyone can press after betting ends) */}
          {phase === PHASE.Betting && (
            <button className="btn btn-outline btn-sm w-full" disabled={isStarting} onClick={handleStartRound}>
              {isStarting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "⚡ Start Round (after betting closes)"
              )}
            </button>
          )}
        </div>

        {/* Right: Stats */}
        <div className="space-y-3">
          {/* Game Stats */}
          <div className="bg-base-200 rounded-xl p-4">
            <h3 className="font-bold mb-2 text-sm uppercase opacity-70">Game Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="opacity-70">Total Burned</span>
                <div className="font-mono font-bold text-orange-400">
                  🔥 {totalBurned ? Number(formatEther(totalBurned)).toLocaleString() : "0"} CLAWD
                </div>
              </div>
              <div>
                <span className="opacity-70">This Round</span>
                <div className="font-mono">
                  {totalBets ? Number(formatEther(totalBets)).toLocaleString() : "0"} CLAWD
                </div>
              </div>
              <div>
                <span className="opacity-70">Players</span>
                <div className="font-mono">{playerCount}</div>
              </div>
              <div>
                <span className="opacity-70">Round</span>
                <div className="font-mono">#{currentRoundId?.toString() || "0"}</div>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div className="bg-base-200 rounded-xl p-4">
            <h3 className="font-bold mb-2 text-sm uppercase opacity-70">How to Play</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside opacity-80">
              <li>Place your bet during the betting phase</li>
              <li>Watch the multiplier climb from 1.00x</li>
              <li>Cash out before it crashes!</li>
              <li>If it crashes before you cash out, you lose your bet</li>
              <li>Lost bets are burned 🔥</li>
            </ol>
          </div>

          {/* Contract */}
          <div className="text-center text-sm opacity-70">
            <span>Contract: </span>
            {contractInfo?.address ? <Address address={contractInfo.address} /> : <span>Not deployed</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
