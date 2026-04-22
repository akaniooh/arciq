"use client";
import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useTheme } from "@/lib/theme";

const ARC_TESTNET_ID = 5042002;

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const { dark } = useTheme();

  // Auto-switch when wallet connects on wrong network
  useEffect(() => {
    if (isConnected && chainId !== ARC_TESTNET_ID) {
      // Small delay to let the wallet settle after connecting
      const timer = setTimeout(() => {
        switchChain({ chainId: ARC_TESTNET_ID });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isConnected, chainId]);

  if (!isConnected || chainId === ARC_TESTNET_ID) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium ${dark ? "bg-yellow-600 text-white" : "bg-yellow-500 text-gray-900"}`}>
      <span className="text-xs sm:text-sm">Wrong network — Arc Testnet required</span>
      <button
        onClick={() => switchChain({ chainId: ARC_TESTNET_ID })}
        disabled={isPending}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dark ? "bg-gray-900 text-white hover:bg-gray-700" : "bg-gray-900 text-white hover:bg-gray-700"} disabled:opacity-50`}
      >
        {isPending ? "Switching..." : "Switch Network"}
      </button>
    </div>
  );
}

// Hook to trigger network switch before any transaction
export function useEnsureArcNetwork() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const ensureNetwork = async () => {
    if (chainId !== ARC_TESTNET_ID) {
      await switchChain({ chainId: ARC_TESTNET_ID });
      // Wait a moment for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  return { ensureNetwork, isCorrectNetwork: chainId === ARC_TESTNET_ID };
}
