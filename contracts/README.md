# GigstarkEscrow Cairo draft

This is a **Sepolia-only app-team draft**. It has not been declared, deployed,
linked to the live STRK20 pool, or used with a wallet or funds. It is not an
official StarkWare escrow package.

The package now builds a stateful `GigstarkEscrow` Starknet contract. Its
constructor pins the privacy pool, arbitrator, and an external action-
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

The test-only `MockAuthorizationVerifier` proves the contract boundary, not a
production authorization scheme. A reviewed cryptographic verifier for the
per-escrow buyer and seller commitments remains a hard deployment blocker.

Run:

```zsh
cd contracts
scarb --version # must report 2.17.0
snforge --version # must report 0.59.0
SCARB_IGNORE_CAIRO_VERSION=true scarb build
scarb run test
```

The narrowly scoped Cairo-version override matches the pinned upstream RC.0
workspace's OpenZeppelin 3.0 compatibility requirement; it is not a deployment
approval. The dependency lock must remain checked in.

The exact upstream release, live pool mismatch, and deployment gate are in
`STRK20_SEPOLIA_PIN.md`.
