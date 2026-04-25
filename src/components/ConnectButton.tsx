"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

// ── Wallet display metadata ───────────────────────────────────────────────────
// logoUrl: use your uploaded logos in /public/wallets/ folder.
// For mobile deep-links, set mobileUri to the wallet's universal link scheme.

interface WalletOption {
  id: string;           // matches connector id from wagmi
  name: string;
  shortName: string;
  logoUrl: string;
  description: string;
  isPopular?: boolean;
  mobileDeepLink?: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "walletConnect",
    name: "WalletConnect",
    shortName: "WalletConnect",
    logoUrl: "/wallets/walletconnect.png",
    description: "Scan with any wallet",
    isPopular: true,
  },
  {
    id: "rabby",
    name: "Rabby Wallet",
    shortName: "Rabby",
    logoUrl: "/wallets/rabby.png",
    description: "The wallet for DeFi",
    mobileDeepLink: "rabby://",
  },
  {
    id: "okx",
    name: "OKX Wallet",
    shortName: "OKX",
    logoUrl: "/wallets/okx.png",
    description: "Your Web3 gateway",
    mobileDeepLink: "okx://wallet",
  },
  {
    id: "zerion",
    name: "Zerion",
    shortName: "Zerion",
    logoUrl: "/wallets/zerion.png",
    description: "Invest in DeFi",
    mobileDeepLink: "zerion://",
  },
];

// ── Wallet logo component — falls back to initial if image fails ──────────────
function WalletLogo({ wallet, size = 40 }: { wallet: WalletOption; size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      >
        {wallet.shortName[0]}
      </div>
    );
  }

  return (
    <img
      src={wallet.logoUrl}
      alt={wallet.name}
      width={size}
      height={size}
      className="rounded-xl object-contain flex-shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

// ── Main ConnectButton ────────────────────────────────────────────────────────
export function ConnectButton({ size = "md" }: { size?: "md" | "lg" }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close modal on successful connect
  useEffect(() => {
    if (isConnected && open) {
      setOpen(false);
      setConnectingId(null);
      setError(null);
    }
  }, [isConnected]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const base = "font-medium rounded-lg border transition-all duration-150";
  const sizes = size === "lg" ? "px-8 py-3 text-base" : "px-4 py-1.5 text-sm";

  // ── Connected state ──────────────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className={`${base} ${sizes} bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300`}
      >
        <span className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </button>
    );
  }

  // ── Trigger button ───────────────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); }}
        className={`${base} ${sizes} bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:scale-95`}
      >
        Connect wallet
      </button>

      {/* ── Modal overlay ─────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal panel */}
          <div
            ref={modalRef}
            className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-scale"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Connect wallet</h2>
                <p className="text-xs text-gray-400 mt-0.5">Choose how you want to connect</p>
              </div>
              <button
                onClick={() => { setOpen(false); setError(null); setConnectingId(null); }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                aria-label="Close"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Wallet list */}
            <div className="px-3 py-3 space-y-1">
              {WALLET_OPTIONS.map((wallet) => {
                // Match this wallet option to the actual wagmi connector
                const connector = connectors.find((c) =>
                  c.id === wallet.id ||
                  c.name.toLowerCase().includes(wallet.shortName.toLowerCase())
                );

                const isConnecting = connectingId === wallet.id && isPending;

                return (
                  <button
                    key={wallet.id}
                    disabled={isConnecting}
                    onClick={async () => {
                      setError(null);
                      setConnectingId(wallet.id);
                      try {
                        if (connector) {
                          connect({ connector });
                        } else if (wallet.mobileDeepLink) {
                          // On mobile, no extension found — open deep link
                          window.open(wallet.mobileDeepLink, "_blank");
                          setConnectingId(null);
                        } else {
                          setError(`${wallet.name} not detected. Please install the extension.`);
                          setConnectingId(null);
                        }
                      } catch (e: any) {
                        setError(e?.message ?? "Connection failed");
                        setConnectingId(null);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group disabled:opacity-60 disabled:cursor-wait"
                  >
                    <WalletLogo wallet={wallet} size={40} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{wallet.name}</span>
                        {wallet.isPopular && (
                          <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{wallet.description}</p>
                    </div>

                    <div className="flex-shrink-0">
                      {isConnecting ? (
                        <svg className="w-4 h-4 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors"
                          viewBox="0 0 16 16" fill="none"
                        >
                          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error message */}
            {error && (
              <div className="mx-3 mb-3 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[11px] text-gray-400 text-center">
                By connecting you agree to our{" "}
                <a href="#" className="text-blue-500 hover:underline">Terms of Service</a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Animation styles ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes fade-scale {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .animate-slide-up   { animation: slide-up   0.25s cubic-bezier(0.32,0.72,0,1) both; }
        .animate-fade-scale { animation: fade-scale 0.2s  cubic-bezier(0.32,0.72,0,1) both; }
        @media (min-width: 640px) {
          .animate-slide-up { animation-name: fade-scale; }
        }
      `}</style>
    </>
  );
}
