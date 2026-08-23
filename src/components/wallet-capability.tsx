"use client";

import { useEffect, useRef, useState } from "react";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import {
  STRK20_WALLET_API_MIN_VERSION,
  detectStrk20WalletApi,
} from "../lib/strk20-wallet";

type CapabilityResult = {
  name: string;
  supported: boolean;
  versions: string[];
  error?: string;
};

export function WalletCapability() {
  const storeRef = useRef<Store | null>(null);
  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
  const [results, setResults] = useState<CapabilityResult[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const store = createStore();
    storeRef.current = store;
    const update = (next: readonly WalletWithStarknetFeatures[]) => setWallets(next);
    update(store.getWallets());
    const unsubscribe = store.subscribe(update);
    store._refreshInjectedWallets();
    return () => {
      unsubscribe();
      storeRef.current = null;
    };
  }, []);

  async function checkCapabilities() {
    const discovered = storeRef.current?.getWallets() ?? wallets;
    setChecking(true);
    const next = await Promise.all(
      discovered.map(async (wallet): Promise<CapabilityResult> => {
        try {
          const capability = await detectStrk20WalletApi(wallet);
          return { name: wallet.name, ...capability };
        } catch (error) {
          return {
            name: wallet.name,
            supported: false,
            versions: [],
            error: error instanceof Error ? error.message : "Capability request failed",
          };
        }
      }),
    );
    setResults(next);
    setChecking(false);
  }

  return (
    <section className="wallet-check" aria-labelledby="wallet-check-title">
      <div>
        <p className="eyebrow">Wallet API readiness</p>
        <h2 id="wallet-check-title">Detect support without opening the wallet.</h2>
        <p>
          This read-only check asks installed wallets only for supported Wallet API versions. It
          does not connect an account, request a private balance, discover notes, collect a viewing
          key, prepare a transfer, or submit a transaction.
        </p>
      </div>
      <div className="wallet-check-action">
        <button type="button" onClick={checkCapabilities} disabled={checking || wallets.length === 0}>
          {checking ? "Checking…" : "Check installed wallets"}
        </button>
        <p role="status">
          {wallets.length === 0
            ? "No Starknet wallet discovered."
            : `${wallets.length} wallet${wallets.length === 1 ? "" : "s"} discovered. Minimum Wallet API: ${STRK20_WALLET_API_MIN_VERSION}.`}
        </p>
        {results.map((result) => (
          <p className="wallet-result" key={result.name}>
            <b>{result.name}</b>: {result.supported ? "compatible" : "not compatible"}
            {result.versions.length > 0 ? ` (${result.versions.join(", ")})` : ""}
            {result.error ? ` — ${result.error}` : ""}
          </p>
        ))}
        <p className="wallet-blocked">
          Transaction preparation remains disabled while the observed Sepolia pool class is not
          mapped to a reviewed source package.
        </p>
      </div>
    </section>
  );
}
