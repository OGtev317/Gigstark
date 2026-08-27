# Gigstark

Gigstark is a non-custodial STRK20 interface for private creator payments on
Starknet Mainnet. A client can shield STRK, pay a registered creator inside the
privacy pool, and withdraw. The connected wallet keeps every signing key,
viewing key, private note, witness, and proof; Gigstark receives only the
requested public action fields and the resulting transaction hash.

Public demo: [gigstark.pages.dev](https://gigstark.pages.dev)

Operator guides: [Mainnet payment runbook](docs/MAINNET_PAYMENT_RUNBOOK.md) ·
[three-minute demo script](docs/DEMO_SCRIPT.md)

## Competition MVP

- Wallet API capability detection without a private-balance probe.
- Strict `SN_MAIN` connection and reviewed STRK20 V2 pool/class verification.
- Pool-native shield, private-transfer, and withdrawal actions for STRK.
- Exact decimal parsing without JavaScript floating-point arithmetic.
- Optional `.stark` name resolution through Starknet.js. Wallet connection is
  the login; a public name is only a display and recipient alias.
- Mandatory wallet dry-run before the signature button is enabled.
- Exact network, pool, token, amount, recipient, and live-read pool-fee review.
- Explicit user acknowledgement and wallet-controlled Mainnet submission.
- Receipt verification requiring success and an event from the reviewed pool.
- Browser-local recovery of submitted public transaction hashes.
- A root `strk20.json` and static Cloudflare Pages deployment.

The live Mainnet pool is
`0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`.
Deposits and withdrawals are public. Transfers inside the pool hide the
pool-side sender, recipient, amount, and spent notes; timing remains observable.

## Post-hackathon roadmap

The repository preserves experimental escrow, subscription, Passport, tier,
custom-ZK, encrypted-messaging, and Oyster/TEE work, but none of it is part of
the competition MVP or advertised as live. Custom contracts remain deployment-
gated pending independent review and production governance inputs.

No Oyster job has been deployed. A future live TEE claim requires a reproducible
immutable workload image, matching image ID, a real Oyster job, raw Nitro
attestation verification including the AWS root and certificate chain,
measurements, freshness, and workload-bound `user_data`. Any TEE result remains
optional and non-authoritative for settlement.

The hosted Starknet ID API is not an authentication service and is not required
by Gigstark. The wallet proves account control by approving the connection and
signs every transaction itself.

## Run locally

```zsh
npm install
npm test
npm run typecheck
npm run build
npm run verify:starknet-health
npm run verify:strk20-pool # expected to fail closed until source reproduction
npm run verify:strk20-mainnet # read-only Mainnet V2 health and class gate
npm run verify:hackathon-submission # fails until hashes and video are complete
npm run review:mainnet-deployment # expected to fail until public review inputs are complete
npm run proof:verify
# npm run compute:verify requires Scarb 2.17.0 and snforge 0.59.0
npm run dev
```

Open `http://localhost:3000`.

`npm run build` also writes the deployable static site to `out/`. The public
deployment includes `/strk20.json`; its empty transaction, contract, and video
fields are deliberate until verified Mainnet evidence exists.

## Contract direction

`contracts/` contains a stateful Cairo anonymizer draft with a
pool-only `privacy_invoke`, balance accounting, cryptographic receipt-based role
authorization, direct-ZK compute resolution, bounded prepaid subscriptions, tier
proof consumption, and one reviewed `OpenNoteDeposit` return per valid claim.
Thirty-six escrow-package contract tests run locally. The generated Garaga
verifier validates the synthetic dispute proof on a read-only Sepolia fork and
now drives the real `GigstarkComputeVerifier` in an integration test. Independent
review, production proving setup, an Oyster image/attestation receipt,
issuer/attestor governance, live Wallet API execution, and the live pool's
upgraded class source provenance remain unresolved. The live ABI and onchain
Sierra/CASM pair reproduce exactly, and the declaration timeline narrows the
source candidate to StarkWare commit `5bf8aae`, but its repository-defined build
profiles do not reproduce the on-chain class hash.
The interface itself is exactly mapped to
`@starkware-libs/starknet-privacy-sdk@0.14.3-rc.5`; that ABI-level result does
not unlock live submission without the matching reviewed Cairo source tree,
lockfile, and effective build profile.
Independent security review and fresh network verification are required before
any declaration or deployment.

`npm run verify:strk20-artifacts` uses an already-installed exact compiler when
available. On Intel or Apple Silicon macOS it otherwise downloads the official
`universal-sierra-compiler 2.8.0` release into a temporary directory and verifies
its pinned SHA-256 digest before execution.

`npm run verify:cairo-release` independently downloads checksum-pinned Scarb
2.17.0 and Starknet Foundry 0.59.0 archives, builds only committed contract
sources in a temporary release workspace, runs the Cairo tests, and writes a
deployment-disabled review manifest for each network lane to
`release/gigstark-sepolia-review.json` and
`release/gigstark-mainnet-review.json`. The Mainnet manifest pins the
source-reproduced V2 pool but deliberately leaves every constructor argument
unset and unreviewed.

Read [the architecture handoff](docs/ARCHITECTURE.md) before beginning that integration.
Track implementation status and release gates in the dedicated [Gigstark roadmap](ROADMAP.md).
Review the [compute specimen](compute/README.md) and its explicit hardware and
test-ceremony boundaries before treating it as deployable.
Review the explicit trust assumptions and blockers in the
[internal security review](docs/SECURITY_REVIEW.md); it is not an independent audit.

## Repository hygiene

`.gitignore` excludes environment files and local agent/chat artifacts. This repository contains no conversation transcript and should not be used to store one.
