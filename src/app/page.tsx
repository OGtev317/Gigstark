import { Demo } from "../components/demo";
import { TierDemo } from "../components/tier-demo";
import { PassportDemo } from "../components/passport-demo";

export default function Home() {
  return <main>
    <nav><a className="mark" href="#top">GIG<span>STARK</span></a><span className="badge">SEPOLIA DESIGN BASELINE</span><a href="#boundaries">Privacy boundary</a></nav>
    <section id="top" className="hero"><p className="eyebrow">Private freelance milestones and creator subscriptions</p><h1>Settle the work.<br /><em>Keep the relationship private.</em></h1><p className="lede">Gigstark uses user-wallet STRK20 actions, unlinkable role commitments, delivery commitments, and one-time settlement claims. It does not claim to cryptographically hide helper amounts or timing.</p><div className="hero-actions"><a className="button" href="#demo">Run the demo</a><span>Non-custodial · no Athera L1/L3 · no deployment</span></div></section>
    <section className="architecture"><article><p className="eyebrow">Escrow</p><h2>Commit, deliver, resolve, claim.</h2><p>Private deposit → delivery commitment → buyer confirmation or arbitrator outcome → a private note for exactly one winner.</p></article><article><p className="eyebrow">Subscriptions</p><h2>Start with one period.</h2><p>Cancellation, expiry, bounded prepaid periods, and creator claims are sequenced after the escrow demo—not autonomous charges.</p></article><article><p className="eyebrow">Access</p><h2>Prove tier, not wallet history.</h2><p>A verifier checks an audience-bound access proof. It never scans a connected wallet to infer patron status.</p></article></section>
    <div id="demo"><Demo /></div>
    <TierDemo />
    <PassportDemo />
    <section id="boundaries" className="boundaries"><p className="eyebrow">Explicit boundaries</p><h2>Privacy is specific, not absolute.</h2><div><p><b>Hidden by intent:</b> party identity inside the STRK20 pool, role mapping, delivery content, and creator-level relationship graph.</p><p><b>Still observable:</b> deposits, withdrawals, helper amount, timing, pool/helper interactions, and any public app-side action. The current helper route does not cryptographically hide amounts.</p><p><b>Not enabled:</b> recurring autonomous charges, live transfers, note discovery, proof generation, contract deployment, Athera receipts, or wallet scanning.</p></div></section>
    <footer>Gigstark local prototype · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
  </main>;
}
