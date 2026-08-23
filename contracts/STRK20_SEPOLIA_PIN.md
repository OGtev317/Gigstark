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

## Read-only Sepolia verification

On 2026-08-23, the recorded endpoint was checked through a public Sepolia RPC:

- chain ID: `SN_SEPOLIA`;
- observed block: `13937194`;
- address class hash:
  `0x56ab118a8a6e38efc93ad758cefe909fee421fa931ce3cf72df624d345623b2`;
- `get_version`: `2.0`.

That live class hash does **not** equal the RC.0 privacy-pool class hash
`0x52107fadffab71bdcbb6b2ccb68ba3e1b5558d94036538053e159d3076ad633`
published in the upstream compatibility table. The live ABI exposes the
expected privacy-pool surface, including `apply_actions`, `compile_actions`,
and `get_fee_amount`, but the upgrade/class mismatch must be reconciled against
primary deployment metadata before any Gigstark declaration or deployment.

The checked-in `.tool-versions` pins Scarb `2.17.0` and Starknet Foundry
`0.59.0`. The Cairo draft imports only the reviewed `OpenNoteDeposit` type from
the pinned contract source. The recorded Sepolia pool address still requires a
fresh read-only class-hash and ABI check immediately before any declaration or
deployment; the upstream repository publishes the reviewed pool class hash but
does not publish this deployment address in its compatibility table.

Gigstark's escrow and action-authorization code is app-team code. It is not an
official STRK20 escrow package and must receive independent Cairo, protocol,
and operational review before declaration or deployment.
