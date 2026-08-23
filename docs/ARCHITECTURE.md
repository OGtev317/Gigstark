# Gigstark architecture and integration boundary

## Scope

Gigstark is a Starknet/STRK20 project. It does not use, call, deploy to, or anchor anything on Athera L1 or L3. The receipt-anchor idea is intentionally deferred; it must not become a pretext for storing identities, amounts, delivery content, or evidence on another chain.

## First demo: escrow

```text
buyer STRK20 wallet
  -> private action: pool withdraws funds to GigstarkEscrow
  -> GigstarkEscrow stores only commitments and settlement state
  -> delivery commitment
  -> buyer confirmation OR arbitrator outcome OR time-based refund
  -> pool credits exactly one open note
```

`GigstarkEscrow` is a **stateful Cairo anonymizer draft**, not an ordinary
public escrow. Its `privacy_invoke` route is callable only by a constructor-
pinned STRK20 privacy pool. Each escrow records role commitments, a delivery
commitment, token, amount, expiry, outcome, action nonce, and two consumed claim
flags. Token and amount are required for settlement and remain observable at
the helper boundary. No raw identity, wallet address, delivery bytes, evidence,
viewing key, spending key, or private witness belongs in helper state.

The Wallet API draft uses two explicit action shapes. A private deposit is
`withdraw -> invoke`, which sends the selected private input to the escrow and
then records it. A winner claim is `open transfer -> invoke`, passing the
wallet-provided open-note placeholder into the helper. The helper approves the
pool to pull the winner's balance and returns exactly one `OpenNoteDeposit`; it
never transfers output directly. Amount is observable at the helper boundary
and must not be described as hidden.

Required pre-deploy checks:

1. Exact Sepolia privacy-pool address and ABI are freshly verified.
2. Wallet capability checks require a supported Wallet API version without asking for private balances as a probe.
3. `strk20PrepareInvoke` succeeds for every action shape before an actual user submission.
4. Cairo unit/property tests cover authorization, expiry, duplicate delivery, replays, single settlement, and both double-claim paths.
5. Independent Cairo/security review and a scoped operational/dispute policy are complete.

The first integration pin is recorded in `contracts/STRK20_SEPOLIA_PIN.md`.
The project compiles with Cairo 2.17.0 and has non-empty contract artifacts plus
25 passing Starknet Foundry tests. The live Sepolia pool class does not match
either of the source-built, reviewed upstream class hashes, so Wallet API
preparation fails closed and declaration/deployment remain blocked.

Preparation and submission read the current chain ID and pool class through the
provider immediately before reaching the wallet. A caller cannot unlock the
flow by passing the reviewed hash as ordinary input while the deployed class is
different.

## Second demo: subscriptions and tier proof

`GigstarkSubscriptions` begins with one user-authorized period. It supports no
more than three paid periods total, cancellation, expiry, and a one-time private
creator claim per paid period. Creator claims unlock at payment. It has no
autonomous recurring charge mechanism.

Tier access is separate from a wallet scan. `GigstarkTierGate` consumes an
audience-bound passport receipt that binds the viewer commitment, exact tier,
access scope, audience, expiry, credential class, and one scoped nullifier.

## Passport patterns adapted locally

Gigstark borrows protocol patterns—not code, deployed contracts, trust, or network state—from the Athera Passport selective-disclosure design:

- a bounded, revocable policy for a specific audience and tier;
- a receipt bound to that policy, audience, and an expiration time;
- one anti-replay value scoped to the Gigstark policy; and
- proof/disclosure digests rather than private witnesses or user identity data.

The earlier TypeScript checker remains a browser simulation. The Cairo
`GigstarkPassportVerifier` now enforces these bindings cryptographically using
a policy-pinned Stark attestor key and canonical signatures. It verifies an
attested acceptance receipt, not the underlying ZK proof. Issuance, off-chain
proof verification, attestor governance, and an independent audit remain open.

## GigstarkPassport

`contracts/src/gigstark_passport.cairo` is a separately written Gigstark
proof-receipt verifier. It binds an opaque proof commitment to a Gigstark-only
policy, credential class, purpose, audience contract, chain, verifier, exact
action statement, unlinkable role/viewer commitment, validity window, and
scope-specific nullifier. It stores no identity, wallet address, witness,
document, or amount.

It does not import or adapt Athera source code, call Athera L1/L3, verify a
Groth16 proof, or issue a credential. It uses only the high-level minimum-
disclosure, audience-binding, expiry, revocation, and anti-replay patterns. The
future ZK issuer/verifier boundary requires a Starknet-specific design, audit,
and testnet-only review.

## Sources reviewed

- The STRK20 privacy repository documents the pool, helper/anonymizer model, and a compatibility matrix. Its published privacy-pool and Ekubo/Vesu helper class hashes are references, not Gigstark deployment approvals.
- The STRK20 Wallet API route keeps viewing keys, note discovery, proof generation, and submission inside the privacy-enabled user wallet. It requires explicit capability detection and uses an open-note-plus-invoke flow for helper interactions.

## Non-goals

- No autonomous charges or session authority before a separate key-exposure review.
- No public registry modification, contract deployment, funds, tokens, Athera receipt anchor, or claim of cryptographic amount privacy.
