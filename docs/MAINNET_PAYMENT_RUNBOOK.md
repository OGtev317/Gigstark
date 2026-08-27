# Gigstark Mainnet payment runbook

This runbook completes the three wallet-signed STRK20 transactions required for
the Private Sprint. It never asks an operator to export a private key, viewing
key, seed phrase, note, or proof witness.

## Before the session

1. Use the live site at <https://gigstark.pages.dev> and a wallet that reports
   Wallet API `0.10.3` or newer in the site's capability check.
2. Select Starknet Mainnet (`SN_MAIN`) in the wallet.
3. Fund the client wallet with enough STRK for the test value, current pool
   fees, and any wallet-disclosed gas. The site reads the pool fee live.
4. Prepare a second creator wallet. The creator must register itself with the
   privacy pool before it can receive a private transfer. Do not count the
   registration transaction among the three competition transactions.
5. Confirm the site displays pool
   `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`.

## Transaction 1: shield

1. Choose **Shield STRK** and enter a reviewed amount that covers the later
   payments and pool fees.
2. Run **Prepare and dry-run**.
3. Review network, pool, token, amount, and live fee; acknowledge them.
4. Request the Mainnet signature. The wallet may first request an ERC-20
   approval and then the pool deposit. The approval does not qualify; preserve
   the pool-deposit hash returned by Gigstark.
5. Use **Verify receipt and pool event**. Wait about ten blocks before spending
   the new note.

## Transaction 2: private creator payment

1. Choose **Private creator payment**.
2. Enter the creator's registered address or `.stark` name and a small reviewed
   STRK amount.
3. Dry-run, review the resolved address and live fee, acknowledge, and sign.
4. Preserve the relayed transaction hash. Do not infer the payer from the
   transaction sender; private submissions use a relayer.
5. Verify the successful receipt and pool event in Gigstark.

## Transaction 3

Prefer a second real private creator payment to demonstrate repeated product
use. A withdrawal is also a pool-native Gigstark action but makes its recipient
and amount public.

Repeat the prepare, review, explicit-signature, preservation, and receipt checks.

## Final verification

1. Put the three distinct qualifying hashes in both `strk20.json` and
   `public/strk20.json` in the same order. Keep `contracts` empty.
2. Add the public three-minute video URL.
3. Run:

   ```zsh
   npm test
   npm run typecheck
   npm run build
   npm run verify:strk20-mainnet
   npm run verify:hackathon-submission
   ```

4. Deploy `out/` to the existing `gigstark` Pages project, verify the canonical
   URL and `/strk20.json`, then commit and push.

Deposits and withdrawals are public. Private transfers hide the pool-side
sender, recipient, amount, and spent notes; timing and pool use remain visible.
