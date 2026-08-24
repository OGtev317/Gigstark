import assert from "node:assert/strict";
import test from "node:test";
import {
  STARKNET_SEPOLIA_CHAIN_ID,
  assertHealthyHeads,
  assertPoolAgreement,
  canonicalAbiSha256,
  verifyPoolAbiSurface,
  type StarknetHeadSnapshot,
  type StarknetPoolSnapshot,
} from "../src/lib/starknet-health";
import { STRK20_EXPECTED_LIVE_ABI_SHA256 } from "../src/lib/strk20-sepolia";

const head = (endpoint: string): StarknetHeadSnapshot => ({
  endpoint,
  chainId: STARKNET_SEPOLIA_CHAIN_ID,
  specVersion: "0.10.2",
  blockNumber: 100,
  blockHash: "0xabc",
  parentHash: "0xdef",
  status: "ACCEPTED_ON_L2",
  timestamp: 1_000,
  starknetVersion: "0.14.3",
  transactionCount: 1,
  syncing: false,
});

const pool = (endpoint: string): StarknetPoolSnapshot => ({
  endpoint,
  blockNumber: 100,
  blockHash: "0xabc",
  classHash: "0x123",
  recomputedClassHash: "0x123",
  classVersion: "0.1.0",
  abiSha256: STRK20_EXPECTED_LIVE_ABI_SHA256,
  poolVersion: "2.0",
  feeAmount: "1",
  proofValidityBlocks: "450",
  upgradeDelaySeconds: "0",
  requiredAbiSurface: [
    "compile_actions",
    "apply_actions",
    "get_version",
    "get_fee_amount",
    "get_proof_validity_blocks",
    "InvokeExternalInput",
    "ExternalContractInvoked",
  ],
});

test("accepts two current, accepted Sepolia heads", () => {
  assert.doesNotThrow(() => assertHealthyHeads([head("one"), head("two")], 1_030, 120));
});

test("rejects wrong-chain and stale providers", () => {
  assert.throws(
    () => assertHealthyHeads([{ ...head("one"), chainId: "0x1" }, head("two")], 1_030, 120),
    /STARKNET_WRONG_CHAIN/,
  );
  assert.throws(
    () => assertHealthyHeads([head("one"), { ...head("two"), timestamp: 800 }], 1_030, 120),
    /STARKNET_STALE_HEAD/,
  );
});

test("accepts exact pool state and rejects provider disagreement", () => {
  assert.doesNotThrow(() => assertPoolAgreement([pool("one"), pool("two")]));
  assert.throws(
    () => assertPoolAgreement([pool("one"), { ...pool("two"), blockHash: "0x999" }]),
    /STARKNET_BLOCK_DISAGREEMENT/,
  );
  assert.throws(
    () => assertPoolAgreement([pool("one"), { ...pool("two"), classHash: "0x999" }]),
    /STARKNET_POOL_CLASS_DISAGREEMENT/,
  );
  assert.throws(
    () => assertPoolAgreement([pool("one"), { ...pool("two"), abiSha256: "bad" }]),
    /STARKNET_POOL_ABI_MISMATCH/,
  );
});

test("canonical ABI hashing is key-order independent", () => {
  assert.equal(
    canonicalAbiSha256({ b: 2, a: [{ d: 4, c: 3 }] }),
    canonicalAbiSha256({ a: [{ c: 3, d: 4 }], b: 2 }),
  );
});

test("requires the V2 invoke and view ABI surface", () => {
  const abi = [
    {
      type: "interface",
      name: "Pool",
      items: [
        ...[
          "compile_actions",
          "apply_actions",
          "get_version",
          "get_fee_amount",
          "get_proof_validity_blocks",
        ].map((name) => ({ type: "function", name })),
      ],
    },
    {
      type: "struct",
      name: "privacy::actions::InvokeExternalInput",
      members: [
        {
          name: "contract_address",
          type: "core::starknet::contract_address::ContractAddress",
        },
        { name: "calldata", type: "core::array::Span::<core::felt252>" },
      ],
    },
    {
      type: "enum",
      name: "privacy::actions::ClientAction",
      variants: [
        { name: "InvokeExternal", type: "Invoke" },
        { name: "ComputeAndInvoke", type: "Compute" },
      ],
    },
    {
      type: "event",
      name: "privacy::events::ExternalContractInvoked",
      members: [
        {
          name: "contract_address",
          type: "core::starknet::contract_address::ContractAddress",
        },
        { name: "selector", type: "core::felt252" },
      ],
    },
  ];
  assert.equal(verifyPoolAbiSurface(abi).length, 7);
  assert.throws(
    () =>
      verifyPoolAbiSurface(
        abi.filter((entry) => entry.name !== "privacy::actions::InvokeExternalInput"),
      ),
    /STARKNET_POOL_ABI_ITEM_MISSING/,
  );
});
