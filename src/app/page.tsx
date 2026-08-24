import { Demo } from "../components/demo";
import { TierDemo } from "../components/tier-demo";
import { PassportDemo } from "../components/passport-demo";
import { WalletCapability } from "../components/wallet-capability";

export default function Home() {
  return <main>
    <nav><a className="mark" href="#top">GIG<span>STARK</span></a><span className="badge">SEPOLIA DESIGN BASELINE</span><a href="#boundaries">Privacy boundary</a></nav>
    <section id="top" className="hero"><p className="eyebrow">Private freelance milestones and creator subscriptions</p><h1>Private compute.<br /><em>Verifiable outcomes.</em></h1><p className="lede">Gigstark combines TEE-protected evaluation, ZK policy proofs, STRK20 settlement, unlinkable role commitments, and one-use outcome receipts. Helper amounts and timing are not cryptographically hidden.</p><div className="hero-actions"><a className="button" href="#compute">See the compute path</a><span>Non-custodial · no Athera L1/L3 · no deployment</span></div></section>
    <section className="architecture"><article><p className="eyebrow">Escrow</p><h2>Commit, compute, settle.</h2><p>Private deposit → delivery commitment → buyer confirmation or TEE+ZK dispute outcome → one private note for exactly one winner.</p></article><article><p className="eyebrow">Subscriptions</p><h2>Start with one period.</h2><p>Cancellation, expiry, bounded prepaid periods, and creator claims are sequenced after the escrow demo—not autonomous charges.</p></article><article><p className="eyebrow">Access</p><h2>Prove tier, not wallet history.</h2><p>A verifier checks an audience-bound access proof. It never scans a connected wallet to infer patron status.</p></article></section>
    <section id="compute" className="compute-architecture"><div><p className="eyebrow">Hybrid verifiable compute</p><h2>Confidential execution and cryptographic policy binding.</h2><p>Encrypted evidence is evaluated inside an approved TEE. A separate ZK verifier approves the committed policy result. Cairo accepts the result only when both approvals bind the same audience, job, input, outcome, expiry, and one-use nullifier.</p></div><ol><li><b>1 · Commit</b><span>Evidence stays encrypted; only its commitment enters the statement.</span></li><li><b>2 · Attest</b><span>The TEE authority binds the result to an approved program measurement.</span></li><li><b>3 · Prove</b><span>The ZK authority approves the proof commitment for the pinned policy.</span></li><li><b>4 · Consume</b><span>Starknet verifies both signatures and rejects replay before settlement.</span></li></ol><p className="compute-caveat">Current boundary: dual signed receipts are verified. Raw vendor quote chains and underlying ZK proofs are not yet verified directly onchain.</p></section>
    <WalletCapability />
    <div id="demo"><Demo /></div>
    <TierDemo />
    <PassportDemo />
    <section id="boundaries" className="boundaries"><p className="eyebrow">Explicit boundaries</p><h2>Privacy is specific, not absolute.</h2><div><p><b>Hidden by intent:</b> party identity inside the STRK20 pool, private evidence, proof witnesses, role mapping, and delivery content.</p><p><b>Still observable:</b> compute outcome and commitments, deposits, withdrawals, helper amount, timing, and pool/helper interactions.</p><p><b>Still gated:</b> direct vendor-attestation and ZK-proof verification, live enclave/prover execution, live transfers, recurring charges, and deployment are not enabled.</p></div></section>
    <footer>Gigstark local prototype · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
  </main>;
}
