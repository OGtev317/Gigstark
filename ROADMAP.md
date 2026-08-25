# Gigstark roadmap

Last reviewed: 2026-08-24

Gigstark is a standalone Starknet and STRK20 project for private freelance
milestones, creator subscriptions, and proof-gated access. Its strategic center
is now direct ZK settlement with an optional, independently verifiable Oyster
TEE receipt for confidential execution evidence. Oyster never becomes a second
settlement authority. It does not use Athera L1 or L3 contracts. Development remains local and Sepolia-only until
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
3. The buyer confirms delivery and the seller receives exactly one private
   note.
4. A dispute variant produces a ZK proof over the committed private evidence.
5. Cairo directly verifies the proof and binds its eight public signals to the
   exact job, input, policy, result, outcome, and expiry.
6. An independently verifiable Oyster receipt may attest to the same program and
   result, but is not required for Cairo to resolve the seller or buyer.
7. Replayed compute receipts, actions, and double claims fail.
8. A one-period subscription and audience-bound tier proof work as the second
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
- Maintain local TypeScript models for escrow, subscriptions, tier access,
  GigstarkPassport, direct ZK compute binding, and optional Oyster receipts.
- Verify the production web build, TypeScript checks, tests, and dependency
  audit.

## Milestone 1 — escrow state kernel

**Status: Complete as a local model; stateful contract draft now in Milestone 2**

- Model deposit, delivery, buyer confirmation, dispute, compute outcome,
  timeout refund, and one winner claim.
- Reject invalid ordering, replayed confirmation, and double claims.
- Store role commitments, delivery commitment, token, amount, deadline,
  outcome, action nonce, and claim-consumption flags in the contract. Token and
  amount remain observable at the helper boundary.

The original pure state kernel has been replaced by a stateful contract draft.

## Milestone 2 — production-shaped STRK20 escrow

**Status: In progress — implementation complete locally; review and pool mapping gated**

Current progress:

- Scarb 2.17.0 and Starknet Foundry 0.59.0 are pinned.
- The RC.0 privacy contract source and `OpenNoteDeposit` type are locked to an
  exact upstream commit.
- A non-empty `GigstarkEscrow` contract artifact is generated.
- Pool caller, collateral accounting, direct-ZK compute resolution, expiry,
  seller/buyer winner, role authorization, replay, approval, and double-claim
  tests pass locally.
- The live Sepolia pool address currently reports an upgraded class hash that
  matches neither the source-built RC.0 class nor the source-built official V2
  tag. The exact source package behind the live class is not published in the
  reviewed deployment metadata.
- The live class's complete ABI and declaration timeline match StarkWare commit
  `5bf8aae`, but clean dev, release, and profile-probe artifacts from that
  commit still do not reproduce the live Sierra class hash.
- A read-only Starknet SDK health command requires two providers, current and
  advancing accepted heads, exact common-block agreement, recomputed class and
  ABI fingerprints, and successful pool view calls.
- The class gate verifies the declaration and activation state changes and
  receipts, then exits nonzero because source reproduction remains incomplete.
- The clean-room `GigstarkPassportVerifier` is connected to buyer/seller action
  authorization and cryptographically verifies action-bound signed receipts.
- Thirty-six Cairo tests pass across escrow, passport, direct-ZK compute,
  subscriptions, and tier access.
- The clean-room `GigstarkComputeVerifier` calls a policy-pinned Groth16
  verifier, matches all eight public signals, derives its replay nullifier, and
  emits an optional non-authoritative Oyster receipt reference.
- Escrow, subscription, and tier consumers enforce distinct Passport purposes
  before calling the verifier, preventing cross-purpose policy mistakes.

### Dependency and ABI pin

- Obtain primary-source mapping from the observed Sepolia pool class to its
  exact build artifact/configuration for candidate commit `5bf8aae`; the
  integration fails closed until the class hash is reproduced.
- Verify the current Sepolia privacy-pool address, class, ABI, and supported
  `privacy_invoke` action shape from primary sources.
- Run the project with the pinned Scarb and Cairo toolchain rather than relying
  on an older globally installed compiler.
- Commit a reproducible dependency lock once the real privacy dependency is
  present.
- Treat the pool's current zero-second upgrade delay as a requirement for fresh
  class checks immediately before both preparation and submission.

### Stateful Cairo anonymizer

- Implement `GigstarkEscrow` as a `#[starknet::contract]` stateful anonymizer.
- The constructor pins `GigstarkComputeVerifier`; no direct binary arbitrator
  call remains. Any future human appeal path must be explicitly separate,
  delayed, and governed.
- Allow the pool alone to call `privacy_invoke`.
- Define privacy-pool operations for deposit, delivery, buyer confirmation,
  dispute, timeout, and winner claim without exposing role identities.
- Enforce buyer and seller authorization through action-bound role commitments
  and consumed GigstarkPassport proof receipts. Dispute outcomes must consume a
  direct ZK proof bound to the exact escrow state and evidence root. An Oyster
  receipt may reference the same result but cannot select the outcome.
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
- Only a valid, one-use compute result bound to the exact disputed escrow input
  can resolve a dispute.
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

**Status: Review and submission UI complete locally; live end-to-end execution gated**

- Compatible Starknet Wallet API versions are detected without using a private-
  balance request as a probe.
- Keep note discovery, proof generation, viewing keys, and spending keys inside
  the user's privacy-enabled wallet.
- Build and prepare `withdraw -> invoke` for escrow deposits and `open transfer
  -> invoke` for winner claims before requesting a user signature.
- Display the exact network, helper, token, public amount boundary, expiry, and
  intended winner action before submission.
- Fail closed on unsupported wallets, wrong chain, stale ABI, preparation
  errors, or mismatched contract configuration.
- Unit tests cover version capability checks, exact action/calldata shapes,
  malformed values, preparation versus submission, and fail-closed pool class
  validation.
- The review UI verifies the connected account advertises Starknet Sepolia,
  displays the exact public settlement boundary, dry-runs before submission,
  and requires an explicit acknowledgement before enabling the wallet signature
  request.
- Wrong-chain, wallet-rejection, and submit-control UI states are covered by
  deterministic tests. Rejections state that nothing was submitted.
- Preparation and submission query the provider for the current chain ID and
  pool class instead of trusting class metadata supplied by the caller.
- The installed-wallet capability check remains read-only and separate from the
  explicit connection control. No balance or key request is used.

Remaining:

- Add the winner-claim review screen after an escrow helper address and the live
  pool source mapping are approved.
- Execute a reviewed Sepolia flow only after the live pool source mapping is
  resolved.

### Milestone 3 exit gate

A reviewed end-to-end local or Sepolia test must show a user-authorized private
deposit and exactly one valid winner note without exposing wallet secrets or
moving production funds.

## Milestone 4 — subscriptions and tier access

**Status: Contract and tier-gate drafts complete locally; wallet execution planned**

- Start with one explicitly authorized paid period.
- Support at most three prepaid periods, cancellation, expiry, and one private
  creator claim per paid period.
- Creator claims unlock at payment; cancellation stops new prepayment but does
  not remove already paid claims. Contract tests enforce this rule.
- Reuse the reviewed pool-only note-return pattern without enabling autonomous
  charges.
- `GigstarkTierGate` consumes proof receipts bound to the exact gate audience,
  viewer commitment, tier, access scope, policy, expiry, and scoped nullifier
  without wallet scanning.
- Add Wallet API preparation and UI review for period payment and creator
  claims after the escrow end-to-end flow is cleared.

## Milestone 5 — ZK settlement plus Oyster receipt

**Status: Direct real-proof settlement complete locally; live Oyster receipt and production proving remain**

- `GigstarkComputeVerifier` pins the audience, program commitment,
  computation-policy hash, threshold, validity window, and exact Groth16
  verifier contract.
- A valid proof is the only settlement authority. Cairo compares all eight
  public signals, derives the result nullifier, and rejects proof failure,
  substitution, expiry, revocation, wrong audience/job/input, and replay.
- The Garaga `1.1.0` verifier accepts the real BN254 fixture and rejects a
  tampered signal on a read-only Sepolia fork. A third integration test passes
  that proof through the actual Gigstark verifier and consumes the result.
- `GigstarkEscrow.resolve_dispute` derives the expected input from chain,
  contract, escrow state, and action nonce, then maps the verified outcome to
  the buyer or seller. The fast escrow suite uses a mock only at the Groth16
  boundary; the separate fixture test crosses the real boundary.
- The TypeScript model mirrors public binding and replay checks while explicitly
  treating `proofAccepted` as an onchain result, not browser cryptography.
- `oyster-cvm 5.0.1` for Apple Silicon is pinned by SHA-256. The optional
  receipt workflow requires the AWS Nitro root, recency, immutable image ID,
  AMD64 architecture, and exact Cairo-derived `user_data` binding.
- Oyster receipt absence or invalidity cannot authorize, block, or change ZK
  settlement. Cairo emits only the optional raw-bundle hash and expected user
  data binding for independent review.
- The remaining Oyster adapter must derive attestation `user_data` inside the
  workload from the computed result. It must not attest an arbitrary binding
  supplied by an external caller.
- The canonical synthetic dispute computation and eight-signal Groth16
  statement are implemented. The deterministic local ceremony and placeholder
  commitments remain test-only.
- Keep all STRK20 spending/viewing keys, wallet note state, identities, and real
  dispute evidence outside the repository and browser. Real Oyster evidence
  ingestion additionally requires an authenticated encrypted adapter.

### Milestone 5 exit gate

A production-safe circuit setup, reviewed verifying key, valid ZK proof, and
Cairo-consumed result must bind the same test dispute. Separately, a reproducible
Oyster image and freshly validated raw attestation must bind that result in
`user_data`. Wrong public signals, image ID, user data, stale receipt, expiry,
revocation, and replay must fail. Oyster failure must not change ZK settlement.

## Milestone 6 — GigstarkPassport

**Status: Signed proof-receipt verifier complete locally; ZK issuance boundary planned**

- Preserve minimum disclosure, purpose binding, audience binding, expiry, and
  scope-specific replay protection.
- The Cairo verifier supports audience/purpose/credential policies, time bounds,
  policy revocation, canonical Stark signatures, and scoped nullifier replay
  protection.
- Escrow and tier gate consume exact action-bound receipts; adversarial tests
  cover wrong audience, wrong role/tier, expiry, revocation, and replay.
- Specify credential issuance, underlying ZK proof verification, attestor key
  governance/rotation, and operational revocation independently for Starknet.
- Do not import Athera Passport contracts, code, network trust, or identity
  records.
- Describe the current contract accurately as an attested proof-receipt
  verifier, not a direct ZK circuit verifier.

## Milestone 7 — Sepolia release candidate

**Status: Planned; no deployment authorized**

- Complete independent contract, wallet, and privacy reviews.
- Verify current Sepolia chain identity, pool deployment, ABI, class hash, and
  supported wallet versions immediately before any declaration or deployment.
- Document TEE measurement governance, ZK verifier governance, human appeal,
  dispute timing, upgrade policy, emergency response, and user-visible privacy
  limitations.
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
- No claim is made that an Oyster receipt authorizes settlement. Only the
  policy-pinned Groth16 verifier can do so.
- No TEE may receive a STRK20 spending key, viewing key, or wallet note state.
- No conversation transcript, secret, private witness, key, seed phrase, or
  identity document belongs in the repository.

See [the architecture boundary](docs/ARCHITECTURE.md) and
[the STRK20 Sepolia integration pin](contracts/STRK20_SEPOLIA_PIN.md) for the
supporting design constraints. The current app-team findings and unresolved
deployment blockers are tracked in [the internal security review](docs/SECURITY_REVIEW.md).
