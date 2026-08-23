# Gigstark

Gigstark is a local, non-custodial STRK20 prototype for private freelance milestones and creator subscriptions on Starknet. It is a new standalone project and does not use Athera L1 or L3.

## What runs now

- A browser-only escrow state-machine demo: deposit → delivery commitment → buyer confirmation or dispute outcome → one private-note claim.
- Tests for ordering, replay protection, double-claim rejection, seller settlement, and buyer dispute outcomes.
- A bounded subscription state machine: one paid period, maximum three prepaid periods, cancellation, expiry, and one creator claim per period.
- A Passport-inspired tier-receipt verifier model: exact audience/tier binding, policy and receipt expiry, and scoped replay rejection—without wallet scanning.
- GigstarkPassport: a new minimum-disclosure, purpose-bound claim policy model with opaque proof commitments and scoped replay protection.
- A clean-room Cairo passport receipt verifier connected to escrow role
  authorization and an audience-bound tier gate.
- A Wallet API preparation layer for private `withdraw -> invoke` deposits and
  `open transfer -> invoke` winner claims, guarded by exact pool address and
  class checks.
- A safe product boundary: no connected wallet, private key, viewing key, private note, proof, transfer, deployment, or registry action is used.

## What is intentionally not live

The app does not submit STRK20 transactions. It can detect compatible Wallet
API versions and construct/prepare reviewed actions without requesting private
balances or keys. Submission is not connected to the UI, and the current live
Sepolia pool class is intentionally rejected because it has not been mapped to
a reviewed source package. Gigstark must never collect viewing or spending
keys. Autonomous recurring charges remain disabled until scoped session
authority is separately reviewed.

STRK20 can hide parties inside the pool and make Gigstark role commitments unlinkable. It does **not** make helper amount or timing cryptographically private: deposits, withdrawals, helper interactions, amounts at helper boundaries, and timing can be observable.

## Run locally

```zsh
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Contract direction

`contracts/` contains a Sepolia-only, stateful Cairo anonymizer draft with a
pool-only `privacy_invoke`, balance accounting, cryptographic receipt-based role
authorization, arbitrator resolution, bounded prepaid subscriptions, tier
proof consumption, and one reviewed `OpenNoteDeposit` return per valid claim.
Twenty-five contract tests run locally, but independent review, issuer/
attestor governance, live Wallet API execution, and the live pool's upgraded
class/package mapping remain unresolved.
Independent security review and fresh network verification are required before
any declaration or deployment.

Read [the architecture handoff](docs/ARCHITECTURE.md) before beginning that integration.
Track implementation status and release gates in the dedicated [Gigstark roadmap](ROADMAP.md).
Review the explicit trust assumptions and blockers in the
[internal security review](docs/SECURITY_REVIEW.md); it is not an independent audit.

## Repository hygiene

`.gitignore` excludes environment files and local agent/chat artifacts. This repository contains no conversation transcript and should not be used to store one.
