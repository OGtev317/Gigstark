import assert from "node:assert/strict";
import test from "node:test";
import {
  STARKNET_SEPOLIA_WALLET_CHAIN,
  requireSepoliaWalletAccount,
  walletFlowErrorMessage,
  walletReviewControls,
} from "../src/lib/wallet-review";

test("wallet review accepts only a connected Starknet Sepolia account", () => {
  assert.equal(
    requireSepoliaWalletAccount([
      { address: "0x123", chains: [STARKNET_SEPOLIA_WALLET_CHAIN] },
    ]).address,
    "0x123",
  );
  assert.throws(
    () =>
      requireSepoliaWalletAccount([
        { address: "0x123", chains: ["starknet:0x534e5f4d41494e"] },
      ]),
    /WALLET_WRONG_CHAIN/,
  );
  assert.throws(() => requireSepoliaWalletAccount([]), /WALLET_CONNECTION_REJECTED/);
});

test("wrong-chain UI message is specific and confirms preparation stopped", () => {
  assert.equal(
    walletFlowErrorMessage(new Error("WALLET_WRONG_CHAIN")),
    "The connected wallet account is not on Starknet Sepolia. Switch networks and reconnect.",
  );
  assert.equal(
    walletFlowErrorMessage(new Error("STRK20_WRONG_CHAIN")),
    "The configured RPC is not Starknet Sepolia. Preparation stopped before the wallet request.",
  );
});

test("wallet rejection UI does not imply that a transaction was submitted", () => {
  assert.equal(
    walletFlowErrorMessage({ code: 4001, message: "User rejected" }),
    "The wallet request was rejected. Nothing was submitted.",
  );
  assert.equal(
    walletFlowErrorMessage(new Error("User declined the request")),
    "The wallet request was rejected. Nothing was submitted.",
  );
  assert.equal(
    walletFlowErrorMessage({ message: "Request rejected by user" }),
    "The wallet request was rejected. Nothing was submitted.",
  );
});

test("submission stays disabled until dry-run preparation and acknowledgement", () => {
  assert.deepEqual(walletReviewControls("connected", false), {
    canPrepare: true,
    canSubmit: false,
  });
  assert.deepEqual(walletReviewControls("prepared", false), {
    canPrepare: false,
    canSubmit: false,
  });
  assert.deepEqual(walletReviewControls("prepared", true), {
    canPrepare: false,
    canSubmit: true,
  });
  assert.deepEqual(walletReviewControls("submitting", true), {
    canPrepare: false,
    canSubmit: false,
  });
});
