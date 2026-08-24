# GigstarkEscrow Cairo draft

This is a **Sepolia-only app-team draft**. It has not been declared, deployed,
linked to the live STRK20 pool, or used with a wallet or funds. It is not an
official StarkWare escrow package.

The package builds stateful `GigstarkEscrow` and `GigstarkSubscriptions`
contracts, a `GigstarkPassportVerifier`, and an audience-bound
`GigstarkTierGate`. The package also builds `GigstarkComputeVerifier`, the new
hybrid TEE+ZK result-verification boundary. The escrow constructor pins the
privacy pool, compute verifier, and an external action-
authorization verifier. The pool-only `privacy_invoke` route covers deposit,
delivery, buyer confirmation, dispute opening, timeout refund, and one winner
claim. Deposits return an empty span; claims approve the pool and return exactly
one `privacy::objects::OpenNoteDeposit`.

Deposits fail unless the helper's actual token balance covers the previously
accounted balance plus the requested escrow amount. Excess tokens sent directly
to the helper remain unaccounted and cannot block or inflate an escrow.

The helper records token and amount because both are required to settle the
winner note. They are public at the helper boundary and are not described as
cryptographically hidden. User wallet addresses, private witnesses, delivery
contents, and dispute evidence are not stored.

`GigstarkPassportVerifier` consumes Stark-curve signed, action-bound proof
receipts under an audience-specific policy. It rejects wrong audiences, roles,
expiry, revoked policies, and scoped nullifier replay. It is clean-room
Gigstark code and imports no Athera contract, root, trust, or network state. It
is a signed receipt verifier for an opaque proof accepted off-chain, not a
direct ZK circuit verifier.

`GigstarkComputeVerifier` requires two distinct, policy-pinned Stark keys to
approve the same result statement: one represents a TEE measurement/attestation
authority, and the other represents a ZK proof verifier. The receipt binds
chain, verifier, audience, program measurement, computation policy, job,
expected input, evidence/result commitments, binary outcome, attestation/proof
commitments, validity, and a one-use nullifier. It verifies both canonical
signatures; it does not yet parse a vendor certificate/COSE chain or directly
verify the underlying ZK proof. The escrow now derives an exact dispute-input
commitment from its state and consumes one compute result to select the buyer or
seller outcome.

Subscriptions support one initial period, at most three total prepaid periods,
cancellation, expiry, and one creator note per paid period. Claims unlock when
the period is paid; cancellation blocks new prepayment but does not claw back
already paid creator claims. There is no autonomous charging.

Run:

```zsh
cd contracts
scarb --version # must report 2.17.0
snforge --version # must report 0.59.0
scarb build
snforge test
```

The dependency lock must remain checked in. Thirty-four contract tests pass
locally with the pinned toolchain, but this is not a deployment approval.

The exact upstream release, live pool mismatch, and deployment gate are in
`STRK20_SEPOLIA_PIN.md`.
