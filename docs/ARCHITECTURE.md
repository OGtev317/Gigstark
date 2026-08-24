# Gigstark architecture and integration boundary

## Scope

Gigstark is a Starknet/STRK20 project. It does not use, call, deploy to, or anchor anything on Athera L1 or L3. The receipt-anchor idea is intentionally deferred; it must not become a pretext for storing identities, amounts, delivery content, or evidence on another chain.

## Strategic center: private, verifiable computation

Gigstark now combines two verification systems with different jobs:

```text
encrypted evidence + public escrow statement
                  |
                  v
       approved TEE program measurement
       evaluates private evidence and policy
                  |
        attestation commitment + result
                  |
                  v
       ZK policy proof / proof commitment
                  |
                  v
     GigstarkComputeVerifier on Starknet
   checks exact policy, audience, job, input,
  expiry, two approvals, and one-use nullifier
                  |
                  v
       GigstarkEscrow outcome -> STRK20 note
```

The TEE supplies confidentiality during evaluation and a hardware-rooted claim
about the program measurement. The ZK layer supplies a cryptographic statement
that the committed input and result satisfy the declared computation policy.
Neither system receives a STRK20 spending key or viewing key.

The current hackathon contract is intentionally an intermediate boundary. It
verifies two independent, policy-pinned Stark signatures over the exact same
compute receipt:

1. A TEE authority key that must be bound to an approved enclave key or a
   separately validated vendor attestation chain.
2. A ZK verifier authority key that attests it accepted the opaque proof
   commitment for the pinned computation policy.

This is stronger than a single operator receipt, but it is not the same as
directly verifying an AWS Nitro COSE certificate chain or a ZK proof inside the
Gigstark contract. The long-term replacement is a reviewed attestation-proof
adapter plus a direct Cairo/Garaga verifier. The receipt statement is designed
so those verifiers can replace the two authorities without changing escrow job,
input, result, expiry, or nullifier semantics.

Only commitments are public: program-measurement commitment, policy hash, job
ID, input/evidence/result commitments, outcome, attestation commitment, proof
commitment, expiry, and scoped nullifier. Raw evidence, vendor attestation
documents, model prompts/weights when private, ZK witnesses, identities, and
wallet private state remain off-chain.

## First demo: escrow

```text
buyer STRK20 wallet
  -> private action: pool withdraws funds to GigstarkEscrow
  -> GigstarkEscrow stores only commitments and settlement state
  -> delivery commitment
  -> buyer confirmation OR TEE+ZK compute outcome OR time-based refund
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
4. Cairo unit/property tests cover authorization, expiry, duplicate delivery,
   compute-result binding, replays, single settlement, and both double-claim
   paths.
5. TEE measurement governance, vendor attestation validation, ZK circuit/public
   signals, and both authority rotations are independently reviewed.
6. Independent Cairo/security review and a scoped operational/dispute policy are complete.

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

## GigstarkComputeVerifier

`contracts/src/compute_verifier.cairo` is a clean-room, Starknet-native hybrid
receipt verifier. A policy pins the audience contract, program-measurement
commitment, computation-policy hash, validity window, TEE authority Stark key,
and a distinct ZK verifier Stark key. A receipt binds both approvals to the
chain, verifier, policy, job, expected input commitment, private-evidence
commitment, result commitment, binary escrow outcome, vendor-attestation
commitment, ZK-proof commitment, expiry, and scoped nullifier.

The browser TypeScript model checks the same public structure and replay rules,
but treats signatures as opaque. Only the Cairo contract performs Stark-curve
signature verification. No browser simulation is evidence of a real enclave,
vendor quote, or ZK proof.

Before this verifier can drive an escrow outcome, the project must specify:

- the exact TEE platform and accepted vendor root/collateral policy;
- reproducible enclave image measurement and release process;
- nonce/freshness binding and attested enclave public-key binding;
- the exact ZK circuit or Cairo program and canonical public-signal order;
- how a direct verifier or independently operated verifier authority is
  governed, rotated, revoked, and monitored; and
- encrypted evidence ingestion, deletion, availability, and appeal behavior.

## Sources reviewed

- The STRK20 privacy repository documents the pool, helper/anonymizer model, and a compatibility matrix. Its published privacy-pool and Ekubo/Vesu helper class hashes are references, not Gigstark deployment approvals.
- The STRK20 Wallet API route keeps viewing keys, note discovery, proof generation, and submission inside the privacy-enabled user wallet. It requires explicit capability detection and uses an open-note-plus-invoke flow for helper interactions.
- AWS Nitro Enclaves documents that attestation documents are hypervisor-signed,
  CBOR/COSE objects containing PCR measurements plus optional nonce, public key,
  and user data. Debug-mode zero PCRs are not acceptable for cryptographic
  attestation: <https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html>
  and <https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html>.
- Starknet documents both Cairo/STARK provable computation through SHARP and
  SNARK verification in Cairo contracts. These establish feasible proof paths,
  not an audit or approval of Gigstark's future circuit:
  <https://docs.starknet.io/learn/protocol/sharp> and
  <https://docs.starknet.io/build/starknet-by-example/advanced/verify-proofs>.

## Non-goals

- No autonomous charges or session authority before a separate key-exposure review.
- No claim that a dual-signed receipt directly verifies vendor hardware or the
  underlying ZK proof.
- No TEE custody of STRK20 spending keys, viewing keys, or wallet note state.
- No public registry modification, contract deployment, funds, tokens, Athera receipt anchor, or claim of cryptographic amount privacy.
