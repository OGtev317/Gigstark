# Gigstark

Gigstark is a local, non-custodial STRK20 prototype for private freelance milestones and creator subscriptions on Starknet. It is a new standalone project and does not use Athera L1 or L3.

## What runs now

- A browser-only escrow state-machine demo: deposit → delivery commitment → buyer confirmation or dispute outcome → one private-note claim.
- Tests for ordering, replay protection, double-claim rejection, seller settlement, and buyer dispute outcomes.
- A bounded subscription state machine: one paid period, maximum three prepaid periods, cancellation, expiry, and one creator claim per period.
- A Passport-inspired tier-receipt verifier model: exact audience/tier binding, policy and receipt expiry, and scoped replay rejection—without wallet scanning.
- GigstarkPassport: a new minimum-disclosure, purpose-bound claim policy model with opaque proof commitments and scoped replay protection.
- A safe product boundary: no connected wallet, private key, viewing key, private note, proof, transfer, deployment, or registry action is used.

## What is intentionally not live

The app contains no STRK20 transaction wiring yet. The next integration must use a privacy-enabled user's wallet through the Starknet Wallet API; Gigstark must never collect viewing or spending keys. Autonomous recurring charges remain disabled until a scoped session-authority design is separately reviewed.

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
pool-only `privacy_invoke`, balance accounting, an external role-authorization
boundary, arbitrator resolution, and one reviewed `OpenNoteDeposit` return for
the winner. Contract tests run locally, but the production authorization
verifier and the live pool's upgraded class/package mapping remain unresolved.
Independent security review and fresh network verification are required before
any declaration or deployment.

Read [the architecture handoff](docs/ARCHITECTURE.md) before beginning that integration.
Track implementation status and release gates in the dedicated [Gigstark roadmap](ROADMAP.md).

## Repository hygiene

`.gitignore` excludes environment files and local agent/chat artifacts. This repository contains no conversation transcript and should not be used to store one.
