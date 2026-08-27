import { CodeRain } from "../components/code-rain";
import { PrivatePaymentMvp } from "../components/private-payment-mvp";

export default function Home() {
  return <><CodeRain /><main>
    <nav><a className="mark" href="#top">GIG<span>STARK</span></a><span className="badge">PRIVATE SPRINT MVP</span><a href="#pay">Make a payment</a><a href="#roadmap">Roadmap</a></nav>
    <section id="top" className="hero"><p className="eyebrow">Private creator payments · Starknet Mainnet</p><h1>Pay for the work.<br /><em>Hide the relationship.</em></h1><p className="lede">Gigstark is a non-custodial STRK20 payment interface for clients and creators. Shield STRK, pay a registered creator privately, and keep every wallet key and proof inside your wallet.</p><div className="hero-actions"><a className="button" href="#pay">Open Mainnet payment flow</a><a href="#boundaries">Understand privacy</a><span>Wallet-signed · Mainnet pool V2 · no custody</span></div></section>
    <section className="architecture"><article><p className="eyebrow">1 · Shield</p><h2>Enter the pool.</h2><p>The deposit edge is public and screened. Your wallet creates the private note.</p></article><article><p className="eyebrow">2 · Wait</p><h2>Let the note mature.</h2><p>New notes generally need about ten blocks before they can be spent.</p></article><article><p className="eyebrow">3 · Pay</p><h2>Transfer privately.</h2><p>The wallet discovers notes, proves the transfer, signs, and submits without exposing private state to Gigstark.</p></article></section>
    <PrivatePaymentMvp />
    <section id="boundaries" className="boundaries"><p className="eyebrow">Explicit privacy boundary</p><h2>Private where it matters. Honest at the edges.</h2><div><p><b>Hidden inside the pool:</b> sender, recipient, token amount, and which private notes were spent.</p><p><b>Public:</b> deposits, withdrawals, transaction timing, registration events, and the fact that the pool was used.</p><p><b>Never enters Gigstark:</b> signing keys, viewing keys, seed phrases, private notes, proof witnesses, or private balances without separate consent.</p></div></section>
    <section id="roadmap" className="roadmap"><p className="eyebrow">After the sprint</p><h2>Advanced infrastructure remains preserved—not advertised as live.</h2><p>Reviewed escrow, subscriptions, Passport policies, custom ZK settlement, encrypted-message transport, tier gates, and a real Oyster workload with verified Nitro attestation remain post-hackathon work. TEE evidence will stay optional and non-authoritative.</p></section>
    <footer>Gigstark Private Sprint MVP · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
  </main></>;
}
