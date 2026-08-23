# Gigstark roadmap

Last reviewed: 2026-08-23

Gigstark is a standalone Starknet and STRK20 project for private freelance
milestones, creator subscriptions, and proof-gated access. It does not use
Athera L1 or L3 contracts. Development remains local and Sepolia-only until
the contract, wallet, privacy, and operational gates below are complete.

## Status legend

- **Complete** — implemented and verified locally.
- **In progress** — partially implemented; not ready to declare or deploy.
- **Planned** — sequenced after the active milestone.
- **Gated** — intentionally blocked pending a separate security design.

## Must-ship demo

The hackathon demo is complete only when all of these flows work through the
reviewed Cairo contract and a privacy-enabled user wallet:

1. A buyer privately deposits into a milestone escrow.
2. The seller submits a delivery commitment.
3. The buyer confirms delivery.
4. The seller receives exactly one private note.
5. A dispute can resolve to either the seller or the buyer.
6. Replayed actions and double claims fail.
7. A one-period subscription and audience-bound tier proof work as the second
   demo.

The browser simulations demonstrate sequencing, but they do not satisfy this
definition of done by themselves.

## Milestone 0 — project and privacy boundary

**Status: Complete**

- Keep Gigstark isolated from Athera repositories, contracts, and networks.
- Keep identity documents, viewing keys, spending keys, private witnesses,
  delivery contents, and dispute evidence out of the repository and browser.
- State accurately that helper amounts and timing can remain observable.
- Keep autonomous recurring charges disabled.
- Maintain local TypeScript models for escrow, subscriptions, tier access, and
  GigstarkPassport policy binding.
- Verify the production web build, TypeScript checks, tests, and dependency
  audit.

## Milestone 1 — escrow state kernel

**Status: Complete as a local model; stateful contract draft now in Milestone 2**

- Model deposit, delivery, buyer confirmation, dispute, arbitrator outcome,
  timeout refund, and one winner claim.
- Reject invalid ordering, replayed confirmation, and double claims.
- Store role commitments, delivery commitment, token, amount, deadline,
  outcome, action nonce, and claim-consumption flags in the contract. Token and
  amount remain observable at the helper boundary.

The original pure state kernel has been replaced by a stateful contract draft.

## Milestone 2 — production-shaped STRK20 escrow

**Status: In progress — next milestone**

Current progress:

- Scarb 2.17.0 and Starknet Foundry 0.59.0 are pinned.
- The RC.0 privacy contract source and `OpenNoteDeposit` type are locked to an
  exact upstream commit.
- A non-empty `GigstarkEscrow` contract artifact is generated.
- Pool caller, collateral accounting, arbitrator, expiry, seller/buyer winner,
  replay, approval, and double-claim tests pass locally.
- The live Sepolia pool address currently reports an upgraded class hash that
  does not match the RC.0 class hash in the upstream compatibility table.
- The action-authorization verifier is a test mock, not a cryptographic
  production verifier.

### Dependency and ABI pin

- Resolve and lock the exact reviewed STRK20 Sepolia privacy package.
- Verify the current Sepolia privacy-pool address, class, ABI, and supported
  `privacy_invoke` action shape from primary sources.
- Run the project with the pinned Scarb and Cairo toolchain rather than relying
  on an older globally installed compiler.
- Commit a reproducible dependency lock once the real privacy dependency is
  present.

### Stateful Cairo anonymizer

- Implement `GigstarkEscrow` as a `#[starknet::contract]` stateful anonymizer.
- Pin the privacy pool and arbitrator authority during construction.
- Allow the pool alone to call `privacy_invoke`.
- Define privacy-pool operations for deposit, delivery, buyer confirmation,
  dispute, timeout, and winner claim without exposing role identities.
- Enforce buyer, seller, and arbitrator authorization through a separately
  reviewed commitment/proof design; pool-only calling is not sufficient role
  authorization.
- Verify that the helper token balance covers the previously accounted balance
  plus the requested deposit amount. Unsolicited surplus must remain
  unaccounted rather than block or inflate an escrow.
- On deposit, retain the received balance and return an empty
  `Span<OpenNoteDeposit>`.
- On a valid winner claim, approve exactly the stored amount for the pool and
  return exactly one reviewed `OpenNoteDeposit`.
- Reject zero or malformed token addresses, note identifiers, amounts, escrow
  identifiers, deadlines, and operation selectors.

### Contract-level tests

- Correct pool caller succeeds; every other caller fails.
- Buyer and seller role operations cannot be crossed or replayed.
- Only the configured arbitrator can resolve a dispute.
- Confirmation and dispute resolution cannot both settle the same escrow.
- Timeout fails before expiry and refunds the buyer at or after expiry.
- Seller-win and buyer-win paths each return exactly one winner note.
- Wrong-winner, repeated settlement, repeated claim, and both double-claim
  paths fail.
- Token approval and collateral-accounting behavior are tested with a mock token and
  pool.
- Migrate contract testing to Starknet Foundry instead of relying on the
  deprecated `scarb cairo-test` command.

### Milestone 2 exit gate

Milestone 2 is complete only when a non-empty contract artifact is generated,
all contract-level tests pass with the pinned toolchain, and an independent
Cairo/security review finds no unresolved critical or high-severity issues.
Declaration and deployment are not part of this milestone.

## Milestone 3 — Wallet API integration

**Status: Planned**

- Detect compatible Starknet Wallet API and STRK20 capabilities without using
  a private-balance request as a probe.
- Keep note discovery, proof generation, viewing keys, and spending keys inside
  the user's privacy-enabled wallet.
- Prepare the open-note-plus-helper-invoke action before requesting a user
  signature.
- Display the exact network, helper, token, public amount boundary, expiry, and
  intended winner action before submission.
- Fail closed on unsupported wallets, wrong chain, stale ABI, preparation
  errors, or mismatched contract configuration.
- Add frontend tests for capability absence, rejection, malformed responses,
  wrong-chain state, replayed UI actions, and successful preparation.

### Milestone 3 exit gate

A reviewed end-to-end local or Sepolia test must show a user-authorized private
deposit and exactly one valid winner note without exposing wallet secrets or
moving production funds.

## Milestone 4 — subscriptions and tier access

**Status: Local models complete; contract and wallet integration planned**

- Start with one explicitly authorized paid period.
- Support at most three prepaid periods, cancellation, expiry, and one private
  creator claim per paid period.
- Define whether claims unlock at payment or period boundaries and enforce the
  selected rule consistently in contract tests.
- Reuse the reviewed pool-only note-return pattern without enabling autonomous
  charges.
- Replace the simulated tier receipt checker only after a Starknet-native proof
  and issuer/verifier trust model is designed and audited.
- Bind tier proofs to the exact Gigstark audience, tier, policy, expiry, and a
  scope-specific anti-replay value without wallet scanning.

## Milestone 5 — GigstarkPassport

**Status: Policy model complete; cryptographic verifier planned**

- Preserve minimum disclosure, purpose binding, audience binding, expiry, and
  scope-specific replay protection.
- Specify credential issuance, revocation, proof verification, and verifier
  governance independently for Starknet.
- Do not import Athera Passport contracts, code, network trust, or identity
  records.
- Do not describe the current opaque commitment checker as a ZK proof verifier.

## Milestone 6 — Sepolia release candidate

**Status: Planned; no deployment authorized**

- Complete independent contract, wallet, and privacy reviews.
- Verify current Sepolia chain identity, pool deployment, ABI, class hash, and
  supported wallet versions immediately before any declaration or deployment.
- Document arbitrator governance, dispute timing, upgrade policy, emergency
  response, and user-visible privacy limitations.
- Re-run contract tests, frontend tests, production build, typecheck,
  dependency audit, secret scan, and repository hygiene checks.
- Require an explicit deployment decision after reviewing the exact account,
  network, class hash, constructor arguments, nonce, fees, and transaction.

## Gated work — autonomous recurring charges

**Status: Gated**

Recurring charges remain disabled until scoped session authority can constrain
token, amount, recipient/helper, period, cumulative spend, expiry, revocation,
and replay without exposing viewing or spending keys. Prepaid periods remain
the only planned recurring-payment mechanism before that review.

## Release invariants

- No mainnet deployment or production fund movement is implied by a local
  build, test, declaration, or Sepolia result.
- No Athera L1/L3 contract, receipt anchor, registry edit, or cross-chain trust
  dependency is part of the current Gigstark release path.
- No identity or evidence content is placed in public contract state. Helper
  token and amount are public settlement fields.
- No claim is made that STRK20 helper amounts or timing are cryptographically
  hidden.
- No conversation transcript, secret, private witness, key, seed phrase, or
  identity document belongs in the repository.

See [the architecture boundary](docs/ARCHITECTURE.md) and
[the STRK20 Sepolia integration pin](contracts/STRK20_SEPOLIA_PIN.md) for the
supporting design constraints.
