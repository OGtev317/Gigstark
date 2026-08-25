import { Demo } from "../components/demo";
import { TierDemo } from "../components/tier-demo";
import { PassportDemo } from "../components/passport-demo";
import { WalletCapability } from "../components/wallet-capability";

export default function Home() {
  return <main>
    <nav><a className="mark" href="#top">GIG<span>STARK</span></a><span className="badge">SEPOLIA DESIGN BASELINE</span><a href="#boundaries">Privacy boundary</a></nav>
    <section id="top" className="hero"><p className="eyebrow">Private freelance milestones and creator subscriptions</p><h1>Private compute.<br /><em>Verifiable outcomes.</em></h1><p className="lede">Gigstark uses ZK proofs for enforceable STRK20 settlement and optional Oyster attestations for independently verifiable execution receipts. Helper amounts and timing are not cryptographically hidden.</p><div className="hero-actions"><a className="button" href="#compute">See the compute path</a><span>Non-custodial · no Athera L1/L3 · no deployment</span></div></section>
    <section className="architecture"><article><p className="eyebrow">Escrow</p><h2>Commit, prove, settle.</h2><p>Private deposit → delivery commitment → buyer confirmation or ZK dispute outcome → one private note for exactly one winner.</p></article><article><p className="eyebrow">Subscriptions</p><h2>Start with one period.</h2><p>Cancellation, expiry, bounded prepaid periods, and creator claims are sequenced after the escrow demo—not autonomous charges.</p></article><article><p className="eyebrow">Access</p><h2>Prove tier, not wallet history.</h2><p>A verifier checks an audience-bound access proof. It never scans a connected wallet to infer patron status.</p></article></section>
    <section id="compute" className="compute-architecture"><div><p className="eyebrow">ZK settlement · Oyster receipt</p><h2>One authority, one independent witness.</h2><p>Cairo settles only when the policy-pinned Groth16 verifier accepts the proof and all eight public signals match. Oyster can attest to the same workload and result, but its optional receipt cannot block or override settlement.</p></div><ol><li><b>1 · Commit</b><span>Evidence stays private; only its commitment enters the statement.</span></li><li><b>2 · Prove</b><span>The canonical circuit proves the policy result against the committed input.</span></li><li><b>3 · Settle</b><span>Starknet verifies the proof, matches every signal, and rejects replay.</span></li><li><b>4 · Attest</b><span>Oyster optionally binds image ID and result in a separately checked receipt.</span></li></ol><p className="compute-caveat">Current boundary: real synthetic Groth16 proof verification is wired through Cairo. A paid Oyster job and raw attestation have not been created.</p></section>
    <WalletCapability />
    <div id="demo"><Demo /></div>
    <TierDemo />
    <PassportDemo />
    <section id="boundaries" className="boundaries"><p className="eyebrow">Explicit boundaries</p><h2>Privacy is specific, not absolute.</h2><div><p><b>Hidden by intent:</b> party identity inside the STRK20 pool, private evidence, proof witnesses, role mapping, and delivery content.</p><p><b>Still observable:</b> compute outcome and commitments, proof calldata, deposits, withdrawals, helper amount, timing, and pool/helper interactions.</p><p><b>Still gated:</b> production proving setup, live Oyster receipt, live transfers, recurring charges, and deployment are not enabled.</p></div></section>
    <footer>Gigstark local prototype · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
  </main>;
}
