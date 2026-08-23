# STRK20 Sepolia integration pin

Reviewed contract source pin: `starkware-libs/starknet-privacy` tag
`PRIVACY-0.14.3-RC.0`, commit
`fe52334dde1c5479176ab1e75311cf6e81a320c2`. The upstream compatibility
matrix lists this tag for the privacy-pool contract. The later RC.5 release is
an SDK release and is not used as the contract dependency pin.

| Field | Value |
| --- | --- |
| Target network | Starknet Sepolia only |
| Privacy pool | `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91` |
| Upstream Cairo/Starknet package | `2.17.0` |
| Required return | `privacy::objects::OpenNoteDeposit` as `Span<OpenNoteDeposit>` |
| Wallet stack | `starknet@10.4.0`, Wallet API types `0.10.3`, discovery `6.0.2`, wallet standard `6.0.2` |

## Read-only Sepolia verification

On 2026-08-23, the recorded endpoint was checked through a public Sepolia RPC:

- chain ID: `SN_SEPOLIA`;
- observed block: `13938930`;
- address class hash:
  `0x56ab118a8a6e38efc93ad758cefe909fee421fa931ce3cf72df624d345623b2`;
- `get_version`: `2.0`.

That live class hash does **not** equal the RC.0 privacy-pool class hash
`0x52107fadffab71bdcbb6b2ccb68ba3e1b5558d94036538053e159d3076ad633`
published in the upstream compatibility table. A clean build of that tag
reproduced the published RC.0 class hash. A clean build of the official
`CONTRACT_V2_DEPLOYED_MAINNET_2026-07-08` tag reproduced class hash
`0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d`.
Neither reproducible source class matches the observed Sepolia class. The live
ABI exposes the expected privacy-pool surface, including `apply_actions`,
`compile_actions`, and `get_fee_amount`, but no reviewed primary deployment
record currently maps this Sepolia class back to a source package.

A local clean-room source survey rebuilt every contract-affecting mainline
commit from the official screening audit base through current `main`, using
each commit's pinned Scarb generation (`2.17.0` or `2.18.0`). It also checked
the relevant public privacy branch tips. None reproduced `0x56ab...623b2`.
The live ABI includes `ExternalContractInvoked`, which narrows its behavior to
the later V2-era surface, but ABI similarity is not source provenance.

## Compatibility decision

The mismatch is resolved in code by failing closed, not by guessing source
compatibility. Wallet preparation and submission now query the provider for the
chain ID and latest class at the exact pool address; caller-supplied class data
cannot satisfy the runtime gate. The currently observed Sepolia class therefore
raises `STRK20_POOL_CLASS_UNREVIEWED` before the wallet is called. A live demo
is blocked until StarkWare publishes or confirms the package/commit that
produces the observed class, or Gigstark reviews a different exact deployment.

Run `npm run verify:strk20-pool` for a fresh read-only chain/address/class gate.
The command intentionally exits nonzero while the observed class remains
unreviewed. A different endpoint can be supplied through
`GIGSTARK_SEPOLIA_RPC`; no key or account is required.

The checked-in `.tool-versions` pins Scarb `2.17.0` and Starknet Foundry
`0.59.0`. The Cairo draft imports only the reviewed `OpenNoteDeposit` type from
the pinned contract source. The recorded Sepolia pool address still requires a
fresh read-only class-hash and ABI check immediately before any declaration or
deployment; the upstream repository publishes the reviewed pool class hash but
does not publish this deployment address in its compatibility table.

Gigstark's escrow, subscription, tier-gate, and action-authorization code is
app-team code. It is not an
official STRK20 escrow package and must receive independent Cairo, protocol,
and operational review before declaration or deployment.
