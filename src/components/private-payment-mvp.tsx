"use client";

import { useEffect, useRef, useState } from "react";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { RpcProvider, WalletAccountV6, type STRK20_ACTION } from "starknet";
import {
  STRK20_MAINNET_REVIEW_TARGET,
  STRK20_WALLET_API_MIN_VERSION,
  detectStrk20WalletApi,
  verifyReviewedPoolTarget,
} from "../lib/strk20-wallet";
import { requireMainnetWalletAccount, walletFlowErrorMessage } from "../lib/wallet-review";
import {
  STRK_MAINNET_TOKEN,
  buildSimplePaymentActions,
  formatStrkAmount,
  receiptTouchesPool,
  type PaymentOperation,
} from "../lib/simple-mainnet-payment";

const MAINNET_RPC = process.env.NEXT_PUBLIC_GIGSTARK_MAINNET_RPC ?? "https://starknet-rpc.publicnode.com";
const HISTORY_KEY = "gigstark.mainnet-payment-hashes.v1";
type Phase = "disconnected" | "connected" | "preparing" | "prepared" | "submitting" | "submitted" | "confirmed" | "blocked";

export function PrivatePaymentMvp() {
  const storeRef = useRef<Store | null>(null);
  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
  const [walletName, setWalletName] = useState("");
  const [account, setAccount] = useState<WalletAccountV6 | null>(null);
  const [identity, setIdentity] = useState("");
  const [operation, setOperation] = useState<PaymentOperation>("shield");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [resolvedRecipient, setResolvedRecipient] = useState("");
  const [fee, setFee] = useState("");
  const [prepared, setPrepared] = useState<STRK20_ACTION[] | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [phase, setPhase] = useState<Phase>("disconnected");
  const [message, setMessage] = useState("Check a wallet, connect on Mainnet, then prepare one exact action.");
  const [hash, setHash] = useState("");
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const store = createStore();
    storeRef.current = store;
    const update = (next: readonly WalletWithStarknetFeatures[]) => setWallets(next);
    update(store.getWallets());
    const unsubscribe = store.subscribe(update);
    store._refreshInjectedWallets();
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")); } catch { setHistory([]); }
    return () => { unsubscribe(); storeRef.current = null; };
  }, []);

  useEffect(() => {
    if (!account) return;
    return account.onChange(() => {
      setAccount(null); setPrepared(null); setAcknowledged(false); setPhase("disconnected");
      setMessage("The wallet account or network changed. Reconnect and prepare again.");
    });
  }, [account]);

  function resetPreparation() {
    setPrepared(null); setAcknowledged(false); setResolvedRecipient(""); setFee("");
    if (account) setPhase("connected");
  }

  async function checkWallets() {
    const candidates = storeRef.current?.getWallets() ?? wallets;
    setMessage("Checking Wallet API versions without reading balances…");
    for (const wallet of candidates) {
      try {
        const capability = await detectStrk20WalletApi(wallet);
        if (capability.supported) {
          setWalletName(wallet.name);
          setMessage(`${wallet.name} supports Wallet API ${capability.versions.join(", ")}.`);
          return;
        }
      } catch { /* continue to the next installed wallet */ }
    }
    setWalletName("");
    setMessage(`No installed wallet reported Wallet API ${STRK20_WALLET_API_MIN_VERSION} or newer.`);
  }

  async function connect() {
    const wallet = wallets.find((candidate) => candidate.name === walletName);
    if (!wallet) return;
    setMessage("Waiting for Mainnet wallet connection approval…");
    try {
      const capability = await detectStrk20WalletApi(wallet);
      if (!capability.supported) throw new Error("WALLET_API_UNSUPPORTED");
      const connection = await wallet.features["standard:connect"].connect();
      const connected = requireMainnetWalletAccount(connection.accounts);
      const provider = new RpcProvider({ nodeUrl: MAINNET_RPC });
      const nextAccount = new WalletAccountV6({ provider, walletProvider: wallet, address: connected.address });
      await verifyReviewedPoolTarget(provider, STRK20_MAINNET_REVIEW_TARGET);
      setAccount(nextAccount); setPhase("connected");
      try { setIdentity(await provider.getStarkName(connected.address)); } catch { setIdentity(""); }
      setMessage("Connected to the reviewed Mainnet pool. No balance or private note was requested.");
    } catch (error) {
      setAccount(null); setPhase("blocked"); setMessage(walletFlowErrorMessage(error));
    }
  }

  async function resolveTarget(provider: RpcProvider): Promise<string | undefined> {
    if (operation === "shield") return undefined;
    const value = recipient.trim();
    if (!value) throw new Error("RECIPIENT_REQUIRED");
    if (value.toLowerCase().endsWith(".stark")) {
      const address = await provider.getAddressFromStarkName(value.toLowerCase());
      if (!address || BigInt(address) === 0n) throw new Error("STARK_NAME_NOT_FOUND");
      return address;
    }
    return value;
  }

  async function prepare() {
    if (!account) return;
    setPhase("preparing"); setMessage("Verifying Mainnet and asking the wallet for a dry run…");
    try {
      const provider = new RpcProvider({ nodeUrl: MAINNET_RPC });
      await verifyReviewedPoolTarget(provider, STRK20_MAINNET_REVIEW_TARGET);
      const target = await resolveTarget(provider);
      const actions = buildSimplePaymentActions(operation, amount, target);
      const feeResult = await provider.callContract({ contractAddress: STRK20_MAINNET_REVIEW_TARGET.address, entrypoint: "get_fee_amount", calldata: [] });
      await account.strk20PrepareInvoke(actions, true);
      setFee(formatStrkAmount(feeResult[0] ?? "0x0")); setResolvedRecipient(target ?? "");
      setPrepared(actions); setAcknowledged(false); setPhase("prepared");
      setMessage("Dry run completed. Review the exact public fields and pool fee before signing.");
    } catch (error) {
      setPrepared(null); setAcknowledged(false); setPhase("blocked");
      setMessage(error instanceof Error ? error.message : "PREPARATION_FAILED");
    }
  }

  async function submit() {
    if (!account || !prepared || !acknowledged) return;
    setPhase("submitting"); setMessage("Waiting for your explicit Mainnet wallet signature…");
    try {
      const provider = new RpcProvider({ nodeUrl: MAINNET_RPC });
      await verifyReviewedPoolTarget(provider, STRK20_MAINNET_REVIEW_TARGET);
      await account.strk20PrepareInvoke(prepared, true);
      const result = await account.strk20InvokeTransaction(prepared);
      const nextHistory = Array.from(new Set([result.transaction_hash, ...history])).slice(0, 12);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      setHistory(nextHistory); setHash(result.transaction_hash); setPhase("submitted");
      setMessage("Submitted. Preserve this hash even if the selected RPC has not indexed it yet.");
    } catch (error) {
      setPhase("blocked"); setMessage(walletFlowErrorMessage(error));
    }
  }

  async function verifyReceipt(candidate = hash) {
    if (!candidate) return;
    setMessage("Checking the Mainnet receipt and pool event…");
    try {
      const provider = new RpcProvider({ nodeUrl: MAINNET_RPC });
      const receipt = await provider.getTransactionReceipt(candidate);
      if (!receiptTouchesPool(receipt, STRK20_MAINNET_REVIEW_TARGET.address)) {
        throw new Error("Receipt is not yet successful or no STRK20 pool event was found.");
      }
      setHash(candidate); setPhase("confirmed");
      setMessage("Confirmed: successful Mainnet receipt with an event from the reviewed STRK20 pool.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "RECEIPT_NOT_READY");
    }
  }

  const actionLabel = operation === "shield" ? "Shield STRK" : operation === "pay" ? "Private creator payment" : "Withdraw STRK";
  return <section id="pay" className="payment-mvp" aria-labelledby="payment-title">
    <div className="payment-heading"><div><p className="eyebrow">Live Mainnet MVP</p><h2 id="payment-title">One private payment flow. Three verifiable pool receipts.</h2><p>Wallet connection is the login. A resolved <code>.stark</code> name is a public display and recipient alias—not proof of private-pool identity.</p></div><span className="badge">SN_MAIN · POOL V2</span></div>
    <div className="payment-grid"><article><h3>1 · Connect</h3><button type="button" onClick={checkWallets}>Check compatible wallet</button><p>{walletName || `${wallets.length} installed wallet(s) discovered`}</p><button type="button" className="secondary" onClick={connect} disabled={!walletName || Boolean(account)}>{account ? "Wallet connected" : "Connect on Mainnet"}</button>{account ? <p className="mono">{identity || account.address}<br/><small>{identity ? account.address : "No primary .stark name resolved"}</small></p> : null}</article>
      <article><h3>2 · Prepare</h3><label>Action<select value={operation} onChange={(event) => { setOperation(event.target.value as PaymentOperation); resetPreparation(); }}><option value="shield">Shield STRK</option><option value="pay">Private creator payment</option><option value="withdraw">Withdraw STRK</option></select></label><label>Amount in STRK<input inputMode="decimal" placeholder="Example: 10" value={amount} onChange={(event) => { setAmount(event.target.value); resetPreparation(); }}/></label>{operation !== "shield" ? <label>{operation === "pay" ? "Creator .stark name or address" : "Public withdrawal address"}<input placeholder="creator.stark or 0x…" value={recipient} onChange={(event) => { setRecipient(event.target.value); resetPreparation(); }}/></label> : <p className="payment-note">Shielding may require a separate ERC-20 approval prompt. The approval does not count as a hackathon pool transaction.</p>}<button type="button" onClick={prepare} disabled={!account || phase === "preparing"}>{phase === "preparing" ? "Preparing…" : "Prepare and dry-run"}</button></article>
      <article><h3>3 · Review and sign</h3><dl className="review-facts"><div><dt>Network</dt><dd>Starknet Mainnet</dd></div><div><dt>Action</dt><dd>{actionLabel}</dd></div><div><dt>Token</dt><dd>STRK · {STRK_MAINNET_TOKEN}</dd></div><div><dt>Amount</dt><dd>{amount || "—"} STRK</dd></div>{resolvedRecipient ? <div><dt>Recipient</dt><dd>{resolvedRecipient}</dd></div> : null}<div><dt>Pool fee</dt><dd>{fee ? `${fee} STRK (live read)` : "Available after dry run"}</dd></div></dl><label className="review-acknowledgement"><input type="checkbox" checked={acknowledged} disabled={phase !== "prepared"} onChange={(event) => setAcknowledged(event.target.checked)}/>I reviewed the Mainnet network, pool, action, token, amount, recipient, and fee.</label><button type="button" onClick={submit} disabled={!prepared || !acknowledged || phase === "submitting"}>{phase === "submitting" ? "Waiting for wallet…" : "Request Mainnet signature"}</button></article></div>
    <p className="wallet-flow-status" role="status">{message}</p>
    {hash ? <div className="receipt-card"><b>Latest transaction</b><a href={`https://voyager.online/tx/${hash}`} target="_blank" rel="noreferrer">{hash}</a><button type="button" className="secondary" onClick={() => void verifyReceipt()}>Verify receipt and pool event</button></div> : null}
    {history.length ? <details className="transaction-history"><summary>Recover submitted hashes ({history.length})</summary>{history.map((item) => <div key={item}><a href={`https://voyager.online/tx/${item}`} target="_blank" rel="noreferrer">{item}</a><button type="button" className="secondary" onClick={() => void verifyReceipt(item)}>Verify</button></div>)}</details> : null}
    <p className="payment-boundary">Signing keys, viewing keys, notes, witnesses, proof generation, and private balances remain inside the wallet. Deposits and withdrawals are public; private transfers hide pool-side sender, recipient, and amount, while timing remains observable.</p>
  </section>;
}
