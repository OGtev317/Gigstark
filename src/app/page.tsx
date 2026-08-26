import { Demo } from "../components/demo";
import { TierDemo } from "../components/tier-demo";
import { PassportDemo } from "../components/passport-demo";
import { ReleaseStatus } from "../components/release-status";
import { WalletCapability } from "../components/wallet-capability";
import { MarketplaceWorkspace } from "../components/marketplace-workspace";
import { SubscriptionPlanner } from "../components/subscription-planner";
import { LocalDataTools } from "../components/local-data-tools";
import { EncryptedMessaging } from "../components/encrypted-messaging";

export default function Home() {
  return <main>
    <nav><a className="mark" href="#top">GIG<span>STARK</span></a><span className="badge">MAINNET REVIEW CANDIDATE</span><a href="#boundaries">Privacy boundary</a></nav>
    <section id="top" className="hero"><p className="eyebrow">Encrypted creator messaging · private subscriptions</p><h1>Private conversations.<br /><em>Verifiable monetization.</em></h1><p className="lede">Gigstark combines encrypted creator-member messaging with bounded STRK20 subscriptions, private milestone settlement, and proof-gated access. Plaintext stays local; wallet keys, viewing keys, and proof witnesses never enter the app.</p><div className="hero-actions"><a className="button" href="#marketplace">Explore creator monetization</a><a href="#messaging">See encrypted messaging</a><span>Non-custodial · no Athera L1/L3 · onchain deployment gated</span></div></section>
    <ReleaseStatus />
    <section className="architecture"><article><p className="eyebrow">Messaging</p><h2>Encrypt before transport.</h2><p>Creator and member plaintext stays local. Only ciphertext, routing metadata, replay protection, and an integrity digest may reach a future reviewed transport.</p></article><article><p className="eyebrow">Subscriptions</p><h2>Start with one period.</h2><p>Cancellation, expiry, bounded prepayment, and creator claims—never unrestricted autonomous charges.</p></article><article><p className="eyebrow">Monetization</p><h2>Commit, prove, settle.</h2><p>Private deposit → creator delivery commitment → member confirmation or ZK dispute outcome → exactly one winner note.</p></article><article><p className="eyebrow">Access</p><h2>Prove tier, not history.</h2><p>An audience-bound proof can gate creator access without scanning a member wallet or exposing their payment history.</p></article></section>
    <section id="compute" className="compute-architecture"><div><p className="eyebrow">ZK settlement · Oyster receipt</p><h2>One authority, one independent witness.</h2><p>Cairo settles only when the policy-pinned Groth16 verifier accepts the proof and all eight public signals match. Oyster can attest to the same workload and result, but its optional receipt cannot block or override settlement.</p></div><ol><li><b>1 · Commit</b><span>Evidence stays private; only its commitment enters the statement.</span></li><li><b>2 · Prove</b><span>The canonical circuit proves the policy result against the committed input.</span></li><li><b>3 · Settle</b><span>Starknet verifies the proof, matches every signal, and rejects replay.</span></li><li><b>4 · Attest</b><span>Oyster optionally binds image ID and result in a separately checked receipt.</span></li></ol><p className="compute-caveat">Current boundary: real synthetic Groth16 proof verification is wired through Cairo. A paid Oyster job and raw attestation have not been created.</p></section>
    <WalletCapability />
    <MarketplaceWorkspace />
    <SubscriptionPlanner />
    <EncryptedMessaging />
    <LocalDataTools />
    <div id="demo"><Demo /></div>
    <TierDemo />
    <PassportDemo />
    <section id="boundaries" className="boundaries"><p className="eyebrow">Explicit boundaries</p><h2>Privacy is specific, not absolute.</h2><div><p><b>Hidden by intent:</b> party identity inside the STRK20 pool, private evidence, proof witnesses, role mapping, and delivery content.</p><p><b>Still observable:</b> compute outcome and commitments, proof calldata, deposits, withdrawals, helper amount, timing, and pool/helper interactions.</p><p><b>Still gated:</b> production proving setup, live Oyster receipt, live transfers, recurring charges, and deployment are not enabled.</p></div></section>
    <footer>Gigstark local prototype · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
  </main>;
}
