# ZeeroStream handoff

**Updated:** 2026-08-28

## Current checkpoint

ZeeroStream has a working, non-custodial Starknet Mainnet STRK20 payment route:

1. Creator shields STRK and becomes eligible to receive a private transfer.
2. Client shields STRK and waits for the wallet-managed note-maturity condition.
3. Client makes a private creator payment through the reviewed STRK20 pool.

The browser never receives or stores wallet keys, seed phrases, viewing keys,
notes, witnesses, proofs, or private balances. Every payment request remains a
user-controlled Ready X wallet action.

## Verified Mainnet evidence

The three hashes recorded in both `strk20.json` files are the competition
evidence set. Each was checked against two independent Starknet RPC providers
for an accepted, successful receipt containing an event from the reviewed pool.

| Role | Transaction hash |
| --- | --- |
| Creator shield | `0x016301b81ab2fce40fd224140a592a7c23d408ea2f3eb893196c7e4d337f3217` |
| Client shield | `0x03334787479e79a867e85c7427699a7ad3530934800c11c4ed5b0fc431b59f29` |
| Private payment | `0x7f11f4e677a5d6d9cf939d652f5c471e081742bc6aec152491dc56e8757aca0` |

The reviewed pool is:

```text
0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
```

Do not infer the private payment sender, recipient, or amount from its public
receipt. The public receipt proves successful pool use, not those hidden fields.

## Current source-control state

- `origin/main` includes commit `c7b78ef` (`record verified mainnet hackathon receipts`), which records the three receipt hashes and hardens first-shield registration handling.
- Local, uncommitted UI work adds the two-user demo rail, creator handoff card,
  client preflight, and receipt timeline in:
  - `src/components/private-payment-mvp.tsx`
  - `src/app/globals.css`

Before any future commit, inspect the dirty diff and preserve unrelated user
changes.

## Checks last passed

```zsh
npm test
npm run typecheck
npm run build
npm run verify:strk20-mainnet
```

`npm run verify:hackathon-submission` is deliberately not ready until both of
the following are complete:

1. A public demo-video URL is set as `demo_video` in both `strk20.json` and
   `public/strk20.json`.
2. The built `out/` directory is deployed to the existing `gigstark` Pages
   project and the live `/strk20.json` matches the repository manifest.

## Next safe sequence

1. Record a public, approximately three-minute demo using
   `docs/DEMO_SCRIPT.md`. Show creator shield, client shield, private payment,
   the three receipt hashes, and the privacy boundary. Do not show secrets or
   private wallet data.
2. Add the resulting public video URL to both manifests.
3. Re-run the checks above plus:

   ```zsh
   npm run verify:hackathon-submission
   ```

4. Only when explicitly authorized, deploy the already-built static output to
   the existing Pages project, fetch the canonical URL and `/strk20.json`, then
   commit and push the verified deployment state.

## Boundaries

- A wallet connection is not a `.stark` identity claim; a `.stark` name is only
  a public display/recipient alias.
- The wallet must complete the first native Ready X shield if it returns
  `NOT_REGISTERED`; ZeeroStream must not bypass this requirement.
- Never put keys, seed phrases, viewing keys, notes, proofs, witnesses, or
  private balances into Git, browser storage, documentation, logs, or chat.
- Do not describe escrow, subscriptions, custom ZK settlement, encrypted
  messaging, Passport policy, or Oyster/TEE work as live hackathon functionality.
