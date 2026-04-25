"use client";

import { createConfig, http } from "wagmi";
import { hardhat } from "wagmi/chains";
import { defineChain } from "viem";
import { injected, coinbaseWallet, walletConnect } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
});

export const queryClient = new QueryClient();

// WalletConnect project ID — replace with your own from https://cloud.walletconnect.com
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "YOUR_WC_PROJECT_ID";

export const wagmiConfig = createConfig({
  chains: [arcTestnet, hardhat],
  connectors: [
    // Rabby, OKX, Zerion, and any other browser extension all come through injected()
    // We create named instances so we can display them individually in the modal
    injected({ target: "metaMask" }),
    injected({
      target() {
        return {
          id: "rabby",
          name: "Rabby",
          provider: typeof window !== "undefined"
            ? (window as any).rabby ?? (window as any).ethereum
            : undefined,
        };
      },
    }),
    injected({
      target() {
        return {
          id: "okx",
          name: "OKX Wallet",
          provider: typeof window !== "undefined"
            ? (window as any).okxwallet ?? (window as any).ethereum
            : undefined,
        };
      },
    }),
    injected({
      target() {
        return {
          id: "zerion",
          name: "Zerion",
          provider: typeof window !== "undefined"
            ? (window as any).zerionWallet ?? (window as any).ethereum
            : undefined,
        };
      },
    }),
    walletConnect({ projectId: WC_PROJECT_ID }),
    coinbaseWallet({ appName: "ArcIQ" }),
  ],
  transports: {
    [arcTestnet.id]: http("https://rpc.testnet.arc.network"),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
