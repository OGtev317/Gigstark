"use client";

import { useEffect, useRef, useState } from "react";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { RpcProvider, WalletAccountV6, type STRK20_ACTION } from "starknet";
import {
  STRK20_SEPOLIA_POOL_ADDRESS,
  STRK20_WALLET_API_MIN_VERSION,
  detectStrk20WalletApi,
  preparePrivateDepositForReview,
  submitPreparedActions,
} from "../lib/strk20-wallet";
import {
  requireSepoliaWalletAccount,
  walletFlowErrorMessage,
  walletReviewControls,
  type WalletReviewPhase,
} from "../lib/wallet-review";

const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_GIGSTARK_SEPOLIA_RPC ??
  "https://api.cartridge.gg/x/starknet/sepolia";

type CapabilityResult = {
  name: string;
  supported: boolean;
  versions: string[];
  error?: string;
};

type DepositFields = {
  escrowAddress: string;
  token: string;
  amount: string;
  escrowId: string;
  buyerCommitment: string;
  sellerCommitment: string;
  deadline: string;
};

const EMPTY_DEPOSIT: DepositFields = {
  escrowAddress: "",
  token: "",
  amount: "",
  escrowId: "",
  buyerCommitment: "",
  sellerCommitment: "",
  deadline: "",
};

export function WalletCapability() {
  const storeRef = useRef<Store | null>(null);
  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
  const [results, setResults] = useState<CapabilityResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedWalletName, setSelectedWalletName] = useState("");
  const [account, setAccount] = useState<WalletAccountV6 | null>(null);
  const [phase, setPhase] = useState<WalletReviewPhase>("disconnected");
  const [fields, setFields] = useState<DepositFields>(EMPTY_DEPOSIT);
  const [preparedActions, setPreparedActions] = useState<STRK20_ACTION[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [flowMessage, setFlowMessage] = useState(
    "Connect only after reviewing the public settlement fields below.",
  );
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

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

  useEffect(() => {
    if (!account) return;
    const unsubscribe = account.onChange(() => {
      setAccount(null);
      setPreparedActions(null);
      setAcknowledged(false);
      setPhase("disconnected");
      setFlowMessage("The wallet account or network changed. Review and reconnect.");
    });
    return () => unsubscribe();
  }, [account]);

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
    setSelectedWalletName((current) => {
      if (current && next.some((result) => result.name === current && result.supported)) {
        return current;
      }
      return next.find((result) => result.supported)?.name ?? "";
    });
    setChecking(false);
  }

  async function connectWallet() {
    const wallet = wallets.find((candidate) => candidate.name === selectedWalletName);
    if (!wallet) {
      setPhase("blocked");
      setFlowMessage("Select a compatible wallet first.");
      return;
    }

    setFlowMessage("Waiting for wallet connection approval…");
    try {
      const capability = await detectStrk20WalletApi(wallet);
      if (!capability.supported) throw new Error("WALLET_API_UNSUPPORTED");
      const connection = await wallet.features["standard:connect"].connect();
      const connected = requireSepoliaWalletAccount(connection.accounts);
      const provider = new RpcProvider({ nodeUrl: SEPOLIA_RPC });
      const nextAccount = new WalletAccountV6({
        provider,
        walletProvider: wallet,
        address: connected.address,
      });
      setAccount(nextAccount);
      setPreparedActions(null);
      setAcknowledged(false);
      setPhase("connected");
      setFlowMessage("Wallet connected on Starknet Sepolia. No balance or note data was requested.");
    } catch (error) {
      setAccount(null);
      setPreparedActions(null);
      setAcknowledged(false);
      setPhase("blocked");
      setFlowMessage(walletFlowErrorMessage(error));
    }
  }

  function updateField(field: keyof DepositFields, value: string) {
    setFields((current) => ({ ...current, [field]: value.trim() }));
    setPreparedActions(null);
    setAcknowledged(false);
    if (account) setPhase("connected");
    setTransactionHash(null);
  }

  async function prepareDeposit() {
    if (!account) return;
    setPhase("preparing");
    setFlowMessage("Checking Sepolia and the live pool class before requesting a wallet dry run…");
    try {
      const provider = new RpcProvider({ nodeUrl: SEPOLIA_RPC });
      const actions = await preparePrivateDepositForReview(account, provider, {
        escrowAddress: fields.escrowAddress,
        token: fields.token,
        amount: parseRawAmount(fields.amount),
        escrowId: fields.escrowId,
        buyerCommitment: fields.buyerCommitment,
        sellerCommitment: fields.sellerCommitment,
        deadline: fields.deadline,
      });
      setPreparedActions(actions);
      setAcknowledged(false);
      setPhase("prepared");
      setFlowMessage("Dry run prepared successfully. Review once more before requesting a signature.");
    } catch (error) {
      setPreparedActions(null);
      setAcknowledged(false);
      setPhase("blocked");
      setFlowMessage(walletFlowErrorMessage(error));
    }
  }

  async function requestSignature() {
    if (!account || !preparedActions || !acknowledged) return;
    setPhase("submitting");
    setFlowMessage("Waiting for the explicit wallet signature request…");
    try {
      const provider = new RpcProvider({ nodeUrl: SEPOLIA_RPC });
      const result = await submitPreparedActions(account, provider, preparedActions);
      setTransactionHash(result.transaction_hash);
      setPhase("submitted");
      setFlowMessage("The wallet submitted the reviewed STRK20 transaction.");
    } catch (error) {
      setTransactionHash(null);
      setPhase("blocked");
      setFlowMessage(walletFlowErrorMessage(error));
    }
  }

  const controls = walletReviewControls(phase, acknowledged);
  const connectedAddress = account?.address;

  return (
    <section className="wallet-check" aria-labelledby="wallet-check-title">
      <div>
        <p className="eyebrow">Wallet API readiness</p>
        <h2 id="wallet-check-title">Review first. Ask the wallet second.</h2>
        <p>
          Capability detection asks installed wallets only for supported Wallet API versions. It
          does not connect an account, request a private balance, discover notes, collect a viewing
          key, prepare a transfer, or submit a transaction.
        </p>
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
        <label className="wallet-select">
          Compatible wallet
          <select
            value={selectedWalletName}
            onChange={(event) => setSelectedWalletName(event.target.value)}
            disabled={Boolean(account)}
          >
            <option value="">Select after capability check</option>
            {results.filter((result) => result.supported).map((result) => (
              <option value={result.name} key={result.name}>{result.name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="secondary"
          onClick={connectWallet}
          disabled={!selectedWalletName || Boolean(account)}
        >
          {account ? "Connected on Sepolia" : "Connect selected wallet"}
        </button>
        {connectedAddress ? <p className="mono">Connected account: {connectedAddress}</p> : null}
      </div>

      <div className="wallet-check-action">
        <p className="eyebrow">Private escrow deposit review</p>
        <h3>Public settlement fields</h3>
        <p>
          STRK20 hides the pool-side user link, but the helper, token, amount, timing, and open-note
          amount remain public. Values below are never treated as cryptographically hidden.
        </p>
        <div className="review-grid">
          <ReviewField label="Escrow helper" value={fields.escrowAddress} onChange={(value) => updateField("escrowAddress", value)} placeholder="0x…" />
          <ReviewField label="Token" value={fields.token} onChange={(value) => updateField("token", value)} placeholder="0x…" />
          <ReviewField label="Raw token amount" value={fields.amount} onChange={(value) => updateField("amount", value)} placeholder="Base units" />
          <ReviewField label="Deadline" value={fields.deadline} onChange={(value) => updateField("deadline", value)} placeholder="Unix timestamp" />
          <ReviewField label="Escrow ID" value={fields.escrowId} onChange={(value) => updateField("escrowId", value)} placeholder="Non-zero felt" />
          <ReviewField label="Buyer commitment" value={fields.buyerCommitment} onChange={(value) => updateField("buyerCommitment", value)} placeholder="Non-zero felt" />
          <ReviewField label="Seller commitment" value={fields.sellerCommitment} onChange={(value) => updateField("sellerCommitment", value)} placeholder="Different non-zero felt" />
        </div>
        <dl className="review-facts">
          <div><dt>Network</dt><dd>Starknet Sepolia</dd></div>
          <div><dt>Pool</dt><dd>{STRK20_SEPOLIA_POOL_ADDRESS}</dd></div>
          <div><dt>Action</dt><dd>Private withdraw → escrow invoke</dd></div>
          <div><dt>Submission</dt><dd>One explicit wallet request after dry run</dd></div>
        </dl>
        <div className="review-controls">
          <button type="button" onClick={prepareDeposit} disabled={!account || !controls.canPrepare}>
            {phase === "preparing" ? "Preparing…" : "Run wallet dry run"}
          </button>
          <label className="review-acknowledgement">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={phase !== "prepared"}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            I reviewed the network, helper, token, public amount, and deadline.
          </label>
          <button type="button" onClick={requestSignature} disabled={!controls.canSubmit}>
            {phase === "submitting" ? "Requesting…" : "Request wallet signature"}
          </button>
        </div>
        <p className="wallet-flow-status" role="status">{flowMessage}</p>
        {transactionHash ? (
          <p className="wallet-result">
            Submitted hash: <a href={`https://sepolia.voyager.online/tx/${transactionHash}`} target="_blank" rel="noreferrer">{transactionHash}</a>
          </p>
        ) : null}
        <p className="wallet-blocked">
          The current observed Sepolia pool class is still fail-closed because its source build has
          not reproduced the deployed class hash. This screen cannot bypass that gate.
        </p>
      </div>
    </section>
  );
}

function ReviewField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange(value: string): void;
}) {
  return (
    <label>
      {label}
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
    </label>
  );
}

function parseRawAmount(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error("INVALID_DEPOSIT_AMOUNT");
  }
}
