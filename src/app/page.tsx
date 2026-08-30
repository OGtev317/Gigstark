import { CodeRain } from "../components/code-rain";
import { PassportDemo } from "../components/passport-demo";
import { PrivatePaymentMvp } from "../components/private-payment-mvp";
import { TierDemo } from "../components/tier-demo";

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <CodeRain />
      <main id="content">
        <nav aria-label="Primary navigation">
          <a className="mark" href="#top">ZEERO<span>STREAM</span></a>
          <span className="badge">PRIVATE SPRINT MVP</span>
          <a href="#creator">Creator page</a>
          <a href="#disclosure">Disclosure</a>
          <a href="#pay">Private pay</a>
          <a href="#evidence">Evidence</a>
        </nav>

        <section id="top" className="hero">
          <p className="eyebrow">Premium creator payments · Starknet Mainnet</p>
          <h1 className="hero-wordmark">ZEERO<span>STREAM</span></h1>
          <p className="lede">ZeeroStream gives paid creator pages a private checkout lane. Subscribers can send a STRK20 payment with an encrypted memo receipt while wallet keys, notes, and proofs stay inside their own wallet.</p>
          <div className="hero-actions">
            <a className="button" href="#creator">View creator page</a>
            <a href="#boundaries">Understand privacy</a>
            <span>Wallet-signed · Mainnet pool V2 · no custody</span>
          </div>
          <ul className="hero-proof" aria-label="Verified demo highlights">
            <li><b>3 / 3</b><span>Mainnet pool receipts verified</span></li>
            <li><b>0</b><span>Private keys handled by ZeeroStream</span></li>
            <li><b>2 RPCs</b><span>Independent receipt agreement</span></li>
          </ul>
        </section>

        <section id="creator" className="creator-social" aria-label="Creator social preview">
          <div className="creator-cover">
            <div className="creator-avatar" aria-hidden="true">ZS</div>
            <div>
              <p className="eyebrow">Featured creator page</p>
              <h2>Zero Studio</h2>
              <p>Private drops, paid replies, encrypted payment memos, and receipts a creator can read locally.</p>
            </div>
            <a className="button" href="#pay">Subscribe privately</a>
          </div>

          <div className="creator-dashboard">
            <article className="creator-feed">
              <div className="feed-heading">
                <div>
                  <p className="eyebrow">Latest posts</p>
                  <h3>Subscriber feed</h3>
                </div>
                <span>3 locked drops</span>
              </div>
              <div className="social-post unlocked">
                <span className="post-media" aria-hidden="true" />
                <div>
                  <b>Public preview</b>
                  <p>New paid drop is live. Pay privately and attach a receipt memo for custom delivery.</p>
                  <small>Visible to everyone</small>
                </div>
              </div>
              <div className="social-post locked">
                <span className="post-media" aria-hidden="true" />
                <div>
                  <b>Studio tier drop</b>
                  <p>Private media request notes are encrypted before the transaction is signed.</p>
                  <small>Unlock with private payment</small>
                </div>
              </div>
            </article>

            <article className="membership-panel">
              <p className="eyebrow">Creator checkout</p>
              <h3>Support without exposing the relationship.</h3>
              <div className="tier-price"><b>10 STRK</b><span>private payment</span></div>
              <ul>
                <li>Encrypted memo receipt</li>
                <li>Creator-local inbox demo</li>
                <li>Receipt hash for verification</li>
              </ul>
              <a className="button" href="#pay">Start checkout</a>
            </article>

            <article className="inbox-panel">
              <p className="eyebrow">Creator inbox</p>
              <h3>Memo receipt ready</h3>
              <p>Only the intended creator key can decrypt the attached note. ZeeroStream stores ciphertext and payment binding only.</p>
              <div className="inbox-row"><span>Payment hash</span><b>verified</b></div>
              <div className="inbox-row"><span>Memo content</span><b>encrypted</b></div>
            </article>
          </div>
        </section>

        <section className="architecture" aria-label="How a private creator payment works">
          <article><p className="eyebrow">1 · Shield</p><h2>Enter the pool.</h2><p>The deposit edge is public and screened. Your wallet creates the private note.</p></article>
          <article><p className="eyebrow">2 · Wait</p><h2>Let the note mature.</h2><p>New notes generally need about ten blocks before they can be spent.</p></article>
          <article><p className="eyebrow">3 · Pay</p><h2>Transfer privately.</h2><p>The wallet discovers notes, proves the transfer, signs, and submits without exposing private state to ZeeroStream.</p></article>
        </section>

        <section id="disclosure" className="selective-disclosure" aria-labelledby="disclosure-title">
          <div className="disclosure-heading">
            <p className="eyebrow">Selective disclosure</p>
            <h2 id="disclosure-title">Show access. Hide everything else.</h2>
            <p>A creator gate should only learn the answer it needs: this person has the right tier for this page right now. It should not scan wallet history, payment relationships, encrypted memos, private notes, or proof witnesses.</p>
          </div>
          <div className="disclosure-strip" aria-label="Selective disclosure fields">
            <span><b>Disclose</b> Studio tier</span>
            <span><b>Bind</b> this creator feed</span>
            <span><b>Hide</b> wallet history</span>
            <span><b>Reject</b> replayed claims</span>
          </div>
          <div className="disclosure-demo-grid">
            <TierDemo />
            <PassportDemo />
          </div>
        </section>

        <PrivatePaymentMvp />

        <section id="boundaries" className="boundaries">
          <p className="eyebrow">Explicit privacy boundary</p>
          <h2>Private where it matters. Honest at the edges.</h2>
          <div>
            <p><b>Hidden inside the pool:</b> sender, recipient, token amount, and which private notes were spent.</p>
            <p><b>Public:</b> deposits, withdrawals, transaction timing, registration events, and the fact that the pool was used.</p>
            <p><b>Never enters ZeeroStream:</b> signing keys, viewing keys, seed phrases, private notes, proof witnesses, or private balances without separate consent.</p>
          </div>
        </section>

        <section id="roadmap" className="roadmap">
          <p className="eyebrow">After the sprint</p>
          <h2>Advanced infrastructure remains preserved—not advertised as live.</h2>
          <p>Reviewed escrow, subscriptions, Passport policies, custom ZK settlement, encrypted-message transport, tier gates, and a real Oyster workload with verified Nitro attestation remain post-hackathon work. TEE evidence will stay optional and non-authoritative.</p>
        </section>

        <footer>ZeeroStream Private Sprint MVP · User wallets retain signing and viewing keys · <a href="https://github.com/starkware-libs/starknet-privacy">STRK20 reference</a></footer>
      </main>
    </>
  );
}
