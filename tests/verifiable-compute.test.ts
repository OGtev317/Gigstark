import assert from "node:assert/strict";
import test from "node:test";
import {
  createComputePolicy,
  createComputeVerifier,
  verifyComputeReceipt,
  type GigstarkComputeReceipt,
} from "../src/lib/verifiable-compute";

const now = 1_900;
const policy = () =>
  createComputePolicy({
    id: "gigstark:compute:dispute:v1",
    audience: "gigstark:escrow",
    programMeasurement: "measurement:nitro-eif:v1",
    computePolicyHash: "policy:freelance-dispute:v1",
    teeAttestorPublicKey: "stark-key:tee",
    zkVerifierPublicKey: "stark-key:zk",
    validFrom: 1_800,
    validUntil: 2_000,
  });

const receipt = (): GigstarkComputeReceipt => ({
  policyId: "gigstark:compute:dispute:v1",
  audience: "gigstark:escrow",
  jobId: "escrow:42",
  inputCommitment: "input:escrow-state-and-evidence-root",
  evidenceCommitment: "evidence:private-bundle",
  resultCommitment: "result:buyer-wins",
  outcome: "buyer",
  attestationCommitment: "attestation:vendor-quote",
  proofCommitment: "proof:policy-execution",
  scopeNullifier: "compute:once:42",
  issuedAt: 1_890,
  expiresAt: 1_950,
  teeSignature: "signature:tee",
  zkSignature: "signature:zk",
});

test("accepts one TEE plus ZK bound compute result", () => {
  const verifier = createComputeVerifier();
  assert.equal(
    verifyComputeReceipt(
      verifier,
      policy(),
      receipt(),
      "escrow:42",
      "input:escrow-state-and-evidence-root",
      now,
    ),
    "buyer",
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        verifier,
        policy(),
        receipt(),
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /COMPUTE_NULLIFIER_REPLAY/,
  );
});

test("requires independent TEE and ZK authorities", () => {
  assert.throws(
    () =>
      createComputePolicy({
        ...policy(),
        teeAttestorPublicKey: "same-key",
        zkVerifierPublicKey: "same-key",
      }),
    /INVALID_COMPUTE_POLICY/,
  );
});

test("rejects wrong audience, job, or committed input", () => {
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        { ...receipt(), audience: "another-contract" },
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /COMPUTE_BINDING_MISMATCH/,
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        receipt(),
        "escrow:43",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /COMPUTE_JOB_INPUT_MISMATCH/,
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        receipt(),
        "escrow:42",
        "input:substituted",
        now,
      ),
    /COMPUTE_JOB_INPUT_MISMATCH/,
  );
});

test("requires both attestation and proof approvals", () => {
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        { ...receipt(), teeSignature: "" },
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /INVALID_COMPUTE_RECEIPT/,
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        { ...receipt(), zkSignature: "" },
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /INVALID_COMPUTE_RECEIPT/,
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        { ...receipt(), outcome: "abstain" as GigstarkComputeReceipt["outcome"] },
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /INVALID_COMPUTE_RECEIPT/,
  );
});

test("rejects expired receipts and revoked policies", () => {
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        policy(),
        { ...receipt(), expiresAt: now },
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /INVALID_COMPUTE_RECEIPT/,
  );
  assert.throws(
    () =>
      verifyComputeReceipt(
        createComputeVerifier(),
        { ...policy(), active: false },
        receipt(),
        "escrow:42",
        "input:escrow-state-and-evidence-root",
        now,
      ),
    /COMPUTE_POLICY_INACTIVE/,
  );
});
