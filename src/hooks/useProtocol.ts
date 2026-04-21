"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAccount, useReadContract, useWriteContract, useReadContracts, useBalance } from "wagmi";
import {
  CONTRACTS, VAULT_ABI, REPUTATION_ABI, MARKET_ABI, LENDING_ABI, ERC20_ABI,
} from "@/lib/contracts";

const CHAIN_ID = 5042002;

// ── Vault ──────────────────────────────────────────────────────────────────

export function useVaultData() {
  const { address } = useAccount();
  const { data, refetch } = useReadContracts({
    contracts: [
      { address: CONTRACTS.vault as any, abi: VAULT_ABI as any, functionName: "getCollateral", args: [address!] },
      { address: CONTRACTS.vault as any, abi: VAULT_ABI as any, functionName: "freeCollateral", args: [address!] },
      { address: CONTRACTS.vault as any, abi: VAULT_ABI as any, functionName: "locked", args: [address!] },
    ],
    query: { enabled: !!address },
  });
  return {
    collateral: (data?.[0]?.result as bigint) ?? 0n,
    freeCollateral: (data?.[1]?.result as bigint) ?? 0n,
    locked: (data?.[2]?.result as bigint) ?? 0n,
    refetch,
  };
}

export function useDeposit() {
  const { writeContractAsync, isPending } = useWriteContract();
  const approve = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.usdc, abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.vault, amount] });
  const deposit = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.vault, abi: VAULT_ABI, functionName: "deposit", args: [amount] });
  return { approve, deposit, isPending };
}

export function useWithdraw() {
  const { writeContractAsync, isPending } = useWriteContract();
  const withdraw = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.vault, abi: VAULT_ABI, functionName: "withdraw", args: [amount] });
  return { withdraw, isPending };
}

// ── Reputation ─────────────────────────────────────────────────────────────

export function useReputation(address?: `0x${string}`) {
  const { data, refetch } = useReadContract({
    address: CONTRACTS.reputationEngine as any,
    abi: REPUTATION_ABI as any,
    functionName: "getStats",
    args: [address!],
    query: { enabled: !!address },
  });
  const d = data as any;
  return {
    totalPredictions: d?.[0] ?? 0n,
    wins: d?.[1] ?? 0n,
    score: Number(d?.[2] ?? 50n),
    ltvMultiplier: Number(d?.[3] ?? 100n),
    refetch,
  };
}

// ── Markets ────────────────────────────────────────────────────────────────

export function useMarketCount() {
  const { data } = useReadContract({
    address: CONTRACTS.predictionMarket as any,
    abi: MARKET_ABI as any,
    functionName: "marketCount",
  });
  return Number((data as any) ?? 0n);
}

export function useMarket(id: number) {
  const { address } = useAccount();
  const { data: market, refetch: refetchMarket } = useReadContract({
    address: CONTRACTS.predictionMarket as any,
    abi: MARKET_ABI as any,
    functionName: "getMarket",
    args: [BigInt(id)],
  });
  const { data: position, refetch: refetchPosition } = useReadContract({
    address: CONTRACTS.predictionMarket as any,
    abi: MARKET_ABI as any,
    functionName: "getPosition",
    args: [BigInt(id), address!],
    query: { enabled: !!address },
  });
  const { data: payout, refetch: refetchPayout } = useReadContract({
    address: CONTRACTS.predictionMarket as any,
    abi: MARKET_ABI as any,
    functionName: "getPayout",
    args: [BigInt(id), address!],
    query: { enabled: !!address },
  });
  return {
    market: market as any,
    position: position as any,
    payout: (payout as bigint) ?? 0n,
    refetch: () => { refetchMarket(); refetchPosition(); refetchPayout(); },
  };
}

export function usePredict() {
  const { writeContractAsync, isPending } = useWriteContract();
  const approveMarket = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.usdc, abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.predictionMarket, amount] });
  const predict = async (marketId: number, side: boolean, amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.predictionMarket, abi: MARKET_ABI, functionName: "predict", args: [BigInt(marketId), side, amount] });
  const claimWinnings = async (marketId: number) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.predictionMarket, abi: MARKET_ABI, functionName: "claimWinnings", args: [BigInt(marketId)] });
  return { approveMarket, predict, claimWinnings, isPending };
}

// ── Lending ────────────────────────────────────────────────────────────────

export function useLoanData() {
  const { address } = useAccount();
  const { data: loan, refetch: refetchLoan } = useReadContract({
    address: CONTRACTS.lendingEngine as any,
    abi: LENDING_ABI as any,
    functionName: "getLoan",
    args: [address!],
    query: { enabled: !!address },
  });
  const { data: maxBorrow, refetch: refetchMax } = useReadContract({
    address: CONTRACTS.lendingEngine as any,
    abi: LENDING_ABI as any,
    functionName: "maxBorrow",
    args: [address!],
    query: { enabled: !!address },
  });
  const d = loan as any;
  const principal = d?.[0] ?? 0n;
  const interest = d?.[1] ?? 0n;
  const totalDue = d?.[2] ?? 0n;
  const lockedCollateral = d?.[3] ?? 0n;
  const health = d?.[4] ?? 0n;
  return {
    principal,
    interest,
    totalDue,
    lockedCollateral,
    healthFactor: health === 0n ? Infinity : Number(health) / 1e18,
    maxBorrow: (maxBorrow as bigint) ?? 0n,
    hasLoan: principal > 0n,
    refetch: () => { refetchLoan(); refetchMax(); },
  };
}

export function useBorrow() {
  const { writeContractAsync, isPending } = useWriteContract();
  const borrow = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.lendingEngine, abi: LENDING_ABI, functionName: "borrow", args: [amount] });
  return { borrow, isPending };
}

export function useRepay() {
  const { writeContractAsync, isPending } = useWriteContract();
  const approveLending = async (amount: bigint) =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.usdc, abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.lendingEngine, amount] });
  const repay = async () =>
    (writeContractAsync as any)({ chainId: CHAIN_ID, address: CONTRACTS.lendingEngine, abi: LENDING_ABI, functionName: "repay" });
  return { approveLending, repay, isPending };
}

// ── USDC balance ───────────────────────────────────────────────────────────

export function useUSDCBalance() {
  const { address } = useAccount();
  const { data: erc20Balance, refetch: refetchErc20 } = useReadContract({
    address: CONTRACTS.usdc as any,
    abi: ERC20_ABI as any,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });
  const { data: nativeBalance, refetch: refetchNative } = useBalance({
    address,
    query: { enabled: !!address },
  });
  let balance = (erc20Balance as bigint) ?? 0n;
  if (balance === 0n && nativeBalance && nativeBalance.value > 0n) {
    balance = nativeBalance.value / 1_000_000_000_000n;
  }
  return {
    balance,
    refetch: () => { refetchErc20(); refetchNative(); },
  };
}
