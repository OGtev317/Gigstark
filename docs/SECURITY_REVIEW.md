# Gigstark internal security review

Last reviewed: 2026-08-23

This is an app-team review of the local draft, not an independent audit or a
deployment approval. No contract has been declared or deployed and no wallet
action or fund movement was performed.

## Reviewed boundary

- `GigstarkEscrow`, `GigstarkSubscriptions`, `GigstarkPassportVerifier`, and
  `GigstarkTierGate`;
- pool-only `privacy_invoke` routing and `OpenNoteDeposit` returns;
- role, action, purpose, audience, expiry, policy, and nullifier binding;
- token accounting, exact approvals, claim consumption, cancellation, and
  expiry transitions; and
- Wallet API capability detection, calldata construction, provider checks,
  preparation, and explicit submission separation.

## Hardening completed

- The wallet runtime now reads `SN_SEPOLIA` and the latest class at the exact
  pool address from its provider before both preparation and submission. A
  caller-supplied reviewed hash cannot bypass the live class mismatch.
- Escrow, subscription, and tier consumers enforce separate Passport purposes
  before calling the shared verifier.
- Receipt signatures bind chain, verifier, audience, policy, purpose,
  credential class, role/viewer commitment, exact action statement, validity,
  opaque proof commitment, and scoped nullifier.
- Policies and receipts have independent validity windows; policies can be
  revoked; receipt issuance cannot predate the policy.
- Stark signatures reject non-canonical high-`s` values and nullifiers are
  consumed atomically with the authorized action.
- Escrow and subscription claims update accounting and claim state before the
  exact pool approval. Any later pool pull failure reverts the whole Starknet
  transaction.
- TypeScript builders enforce Cairo-sized `u8`, `u64`, and `u128` fields before
  asking a wallet to prove an action.

## Open deployment blockers

1. **Unmapped STRK20 pool class.** The Sepolia class at the documented pool
   address is not reproducible from any checked official tag, contract-changing
   mainline commit, or relevant public privacy branch. Similar ABI shape is not
   source provenance.
2. **Attestor trust.** GigstarkPassport verifies a policy-pinned attestation
   receipt. It does not directly verify the underlying ZK proof. Issuance,
   proof-verifier operation, attestor key storage/rotation, and compromise
   response are not implemented.
3. **Single administrative roles.** Passport administration and dispute
   arbitration are constructor-pinned single addresses in this draft. A
   reviewed multisig/timelock and emergency policy are required before public
   deployment.
4. **No independent Cairo audit.** The app-team tests and this review cannot
   replace independent review, property testing, or testnet adversarial drills.
5. **No live Wallet API E2E.** Ready-wallet proving, rejection, timeout,
   relayer, RPC disagreement, note maturity, and transaction-resume behavior
   remain untested.

## Product and privacy risks

- Helper token, amount, calldata commitments, open-note amounts, timing, and
  the pool/helper interaction remain public.
- Escrow and subscription identifiers must be unpredictable commitments. A
  guessable identifier permits a funded first-writer denial-of-service attempt.
- Subscription creator claims unlock when payment is made. Cancellation blocks
  future prepayment but does not refund or claw back already paid periods.
- A single global action nonce per escrow/subscription intentionally serializes
  competing actions. A receipt prepared before another valid action must be
  prepared again.
- RPC class checks reduce accidental mismatch but still trust the selected RPC
  response. Release operations should compare multiple independent Sepolia
  providers and the primary deployment record.

## Required next review

Do not declare or deploy until the pool source mapping is published, all
constructor roles and exact class hashes are reviewed, an independent Cairo
review closes critical/high findings, and an explicit Sepolia-only transaction
review authorizes the account, nonce, fees, and constructor calldata.
