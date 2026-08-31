# ZeeroStream handoff

**Updated:** 2026-08-31

## Current checkpoint

ZeeroStream is the renamed Gigstark hackathon build. The public MVP is a
non-custodial private creator checkout on Starknet Mainnet:

1. Client or creator uses a privacy-enabled wallet for STRK20 actions.
2. The app prepares a reviewed Mainnet pool action and stops for wallet review.
3. The user signs inside their own wallet.
4. The app records only public receipt hashes and optional encrypted memo
   receipt data.

The live page now presents the product as a premium creator-social checkout:
creator profile, locked drops, private payment CTA, encrypted memo receipt demo,
and a selective-disclosure access demo.

## Live URLs

- Production site: `https://zeerostream.pages.dev`
- Latest deployment checked live: `https://d1ff7a77.zeerostream.pages.dev`
- Public manifest: `https://zeerostream.pages.dev/strk20.json`
- Git remote: `https://github.com/OGtev317/Gigstark.git`

## Latest source state

Latest source update in this handoff:

```text
Add ZeeroStream public demo video
```

Recent shipped commits:

```text
current Add face-camera ZeeroStream demo video
cc2b2e6 Add ZeeroStream public demo video
6508f82 Add selective disclosure demo
bb0b46d Use ZeeroStream wordmark as hero headline
8f2b919 Increase ZeeroStream code rain density
d871048 Switch ZeeroStream to blue grey palette
46c32ff Refresh ZeeroStream creator page
b87b027 Use ZeeroStream Pages URL
f2b4421 Rename build to Zeerostream
c7b78ef record verified mainnet hackathon receipts
```

The worktree was clean before this handoff update. Re-check `git status
--short` before resuming.

## Shipped functionality

- ZeeroStream branding, package name, public manifest URL, and Cloudflare Pages
  project are aligned around `zeerostream`.
- Mainnet private payment MVP remains the core flow:
  - wallet capability check,
  - Mainnet wallet connection,
  - reviewed STRK20 pool target check,
  - dry-run before signing,
  - explicit acknowledgement before wallet signature,
  - receipt verification against the reviewed pool.
- Encrypted memo receipt MVP is wired into the private payment flow:
  - optional private memo textarea,
  - local memo key/contact demo,
  - ciphertext-only receipt storage,
  - creator inbox import/decrypt demo,
  - wrong/tampered/replayed memo packages fail in tests.
- Creator-social page layer is live:
  - ZeeroStream hero wordmark,
  - creator profile preview,
  - locked feed drops,
  - private checkout panel,
  - ultra-blue, silver, and wolf-grey palette,
  - denser blue/silver code-rain background.
- Selective-disclosure demo is live:
  - `Disclosure` nav link,
  - "Show access. Hide everything else." section,
  - tier-gate demo verifier,
  - minimum-disclosure claim demo,
  - explicit copy that wallet history, identity, private notes, memos, and proof
    witnesses are not disclosed.

## Verified Mainnet evidence

The three hashes in both `strk20.json` files are the competition evidence set.
Each represents an accepted, successful receipt containing an event from the
reviewed pool.

| Role | Transaction hash |
| --- | --- |
| Creator shield | `0x016301b81ab2fce40fd224140a592a7c23d408ea2f3eb893196c7e4d337f3217` |
| Client shield | `0x03334787479e79a867e85c7427699a7ad3530934800c11c4ed5b0fc431b59f29` |
| Private payment | `0x7f11f4e677a5d6d9cf939d652f5c471e081742bc6aec152491dc56e8757aca0` |

Reviewed Mainnet STRK20 pool:

```text
0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
```

Do not infer private payment sender, recipient, amount, or memo content from
the public receipt. The receipt proves reviewed pool use, not hidden fields.

## Last checks passed

These were run during the latest page work:

```zsh
npm test
npm run demo:video:face
npm run typecheck
npm run build
npm run verify:strk20-mainnet
npm run verify:hackathon-submission
git diff --check
```

Latest test count observed:

```text
74 passed / 74 total
```

The production route was fetched after deployment and returned the new
selective-disclosure section:

```text
https://zeerostream.pages.dev
```

## Current submission state

`demo_video` is now set to the bundled public MP4 demo asset:

```text
https://zeerostream.pages.dev/zeerostream-demo.mp4
```

The current public MP4 keeps the generated ZeeroStream product demo as the
screen layer and overlays the supplied face-camera recording and audio for the
first 71.30 seconds. The production URL returned `200` with
`content-type: video/mp4`, and `npm run verify:hackathon-submission` returned
`READY_TO_SCORE`.

Current live manifest shape:

```json
{
  "transactions": [
    "0x016301b81ab2fce40fd224140a592a7c23d408ea2f3eb893196c7e4d337f3217",
    "0x03334787479e79a867e85c7427699a7ad3530934800c11c4ed5b0fc431b59f29",
    "0x7f11f4e677a5d6d9cf939d652f5c471e081742bc6aec152491dc56e8757aca0"
  ],
  "contracts": [],
  "demo_video": "https://zeerostream.pages.dev/zeerostream-demo.mp4",
  "demo_url": "https://zeerostream.pages.dev"
}
```

## Next pickup sequence

1. Re-check the repo:

   ```zsh
   cd /Users/tevdev/Desktop/Gigstark
   git status --short
   git log -1 --oneline
   ```

2. Regenerate or replace the public three-minute demo video if the script needs
   a human voiceover. Use plain-language positioning:

   ```text
   ZeeroStream is a private checkout page for creators where subscribers can
   pay and attach an encrypted note without publicly exposing who paid whom.
   ```

3. In the demo, show:
   - creator-social page,
   - private payment flow,
   - optional encrypted memo,
   - creator inbox decrypt demo,
   - selective-disclosure section,
   - three public receipt hashes,
   - explicit wallet-only privacy boundary.

4. Do not show or paste wallet secrets, seed phrases, viewing keys, private
   notes, proof witnesses, private balances, or identity documents.

5. Re-run:

   ```zsh
   npm test
   npm run demo:video:face
   npm run typecheck
   npm run build
   npm run verify:strk20-mainnet
   npm run verify:hackathon-submission
   ```

6. If the verifier passes, deploy the static export:

   ```zsh
   npx wrangler pages deploy out --project-name zeerostream --branch main
   ```

7. Fetch and verify:

   ```zsh
   curl -s https://zeerostream.pages.dev/strk20.json
   ```

8. Commit and push only after the manifest and deployment are verified.

## Boundaries

- A wallet connection is not a `.stark` identity claim.
- A `.stark` name is only a public display or recipient alias.
- Use `supportedWalletApi` capability detection; do not probe private balances.
- Preserve dry-run -> visible review -> acknowledgement -> user wallet signature
  -> accepted receipt/pool-event verification.
- If Ready X returns `NOT_REGISTERED`, use the explicit first-shield
  registration path and wait for note maturity before spending.
- Never move viewing keys, note discovery, proving, signing, or private state
  into the app.
- Never commit chat logs, transcripts, local sessions, wallet secrets, seed
  phrases, private keys, viewing keys, notes, proof witnesses, or private
  balances.
- Do not claim full onchain encrypted mail, helper-contract message storage,
  indexer discovery, production subscriptions, autonomous billing, or creator
  analytics as shipped. Those remain phase-two work.
