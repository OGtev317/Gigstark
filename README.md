# Gigstark

Gigstark is a local, non-custodial STRK20 prototype for private freelance
milestones and creator subscriptions on Starknet. Its settlement center is a
directly verified ZK proof. Marlin Oyster can add a separately verifiable TEE
receipt for confidential execution, but that optional receipt cannot authorize,
block, or override settlement. It is a standalone project and does not use
Athera L1 or L3.

## What runs now

- A browser-only escrow state-machine demo: deposit → delivery commitment → buyer confirmation or dispute outcome → one private-note claim.
- Tests for ordering, replay protection, double-claim rejection, seller settlement, and buyer dispute outcomes.
- A bounded subscription state machine: one paid period, maximum three prepaid periods, cancellation, expiry, and one creator claim per period.
- A Passport-inspired tier-receipt verifier model: exact audience/tier binding, policy and receipt expiry, and scoped replay rejection—without wallet scanning.
- GigstarkPassport: a new minimum-disclosure, purpose-bound claim policy model with opaque proof commitments and scoped replay protection.
- A clean-room Cairo passport receipt verifier connected to escrow role
  authorization and an audience-bound tier gate.
- A clean-room `GigstarkComputeVerifier` that directly calls a policy-pinned
  BN254 Groth16 verifier, checks all eight public signals, derives a one-use
  result nullifier, and treats an Oyster receipt commitment as optional
  non-authoritative evidence.
- A real BN254 Groth16 proof over one synthetic seller-winning dispute and a
  Garaga `1.1.0` Cairo verifier whose integration test authorizes the real
  Gigstark settlement verifier and whose negative test rejects tampering.
- A Mac-compatible Oyster receipt lane pinned to `oyster-cvm 5.0.1`, with an
  immutable-image requirement and offline certificate, freshness, image-ID,
  and `user_data` verification command. No Oyster job has been deployed.
- A Wallet API preparation layer for private `withdraw -> invoke` deposits and
  `open transfer -> invoke` winner claims, guarded by exact pool address and
  class checks.
- A browser review flow that detects capability without balance access, checks
  the connected wallet network, dry-runs the exact deposit actions, and enables
  an explicit signature request only after user acknowledgement.
- A safe product boundary: Gigstark never requests or stores a private key,
  viewing key, private note, or private witness.

## What is intentionally not live

The UI contains an explicit prepare-then-sign transaction flow, but the current
live Sepolia pool class is intentionally rejected before wallet preparation or
submission because it has not been reproduced from a reviewed source build.
Capability detection does not connect a wallet or request private balances.
Once the user explicitly connects, note discovery, proving, and signing remain
inside the wallet. Gigstark must never collect viewing or spending keys.
Autonomous recurring charges remain disabled until scoped session authority is
separately reviewed.

STRK20 can hide parties inside the pool and make Gigstark role commitments unlinkable. It does **not** make helper amount or timing cryptographically private: deposits, withdrawals, helper interactions, amounts at helper boundaries, and timing can be observable.

## Run locally

```zsh
npm install
npm test
npm run typecheck
npm run build
npm run verify:starknet-health
npm run verify:strk20-pool # expected to fail closed until source reproduction
npm run proof:verify
# npm run compute:verify requires Scarb 2.17.0 and snforge 0.59.0
npm run dev
```

Open `http://localhost:3000`.

## Contract direction

`contracts/` contains a Sepolia-only, stateful Cairo anonymizer draft with a
pool-only `privacy_invoke`, balance accounting, cryptographic receipt-based role
authorization, direct-ZK compute resolution, bounded prepaid subscriptions, tier
proof consumption, and one reviewed `OpenNoteDeposit` return per valid claim.
Thirty-six escrow-package contract tests run locally. The generated Garaga
verifier validates the synthetic dispute proof on a read-only Sepolia fork and
now drives the real `GigstarkComputeVerifier` in an integration test. Independent
review, production proving setup, an Oyster image/attestation receipt,
issuer/attestor governance, live Wallet API execution, and the live pool's
upgraded class artifact reproduction remain unresolved. The live ABI and declaration
timeline now narrow the source candidate to StarkWare commit `5bf8aae`, but its
repository-defined build profiles do not reproduce the on-chain class hash.
Independent security review and fresh network verification are required before
any declaration or deployment.

Read [the architecture handoff](docs/ARCHITECTURE.md) before beginning that integration.
Track implementation status and release gates in the dedicated [Gigstark roadmap](ROADMAP.md).
Review the [compute specimen](compute/README.md) and its explicit hardware and
test-ceremony boundaries before treating it as deployable.
Review the explicit trust assumptions and blockers in the
[internal security review](docs/SECURITY_REVIEW.md); it is not an independent audit.

## Repository hygiene

`.gitignore` excludes environment files and local agent/chat artifacts. This repository contains no conversation transcript and should not be used to store one.
