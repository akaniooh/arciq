"use client";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useTheme } from "@/lib/theme";

const ARC_TESTNET_ID = 5042002;

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { dark } = useTheme();

  if (!isConnected || chainId === ARC_TESTNET_ID) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-4 px-4 py-3 bg-yellow-500 text-gray-900 text-sm font-medium">
      <span>⚠ Wrong network — switch to Arc Testnet to use ArcIQ</span>
      <button
        onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
        disabled={isPending}
        className="shrink-0 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? "Switching..." : "Switch to Arc Testnet"}
      </button>
    </div>
  );
}
