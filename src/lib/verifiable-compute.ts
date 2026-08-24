export type ComputeOutcome = "buyer" | "seller";

export type GigstarkComputePolicy = {
  id: string;
  audience: string;
  programMeasurement: string;
  computePolicyHash: string;
  teeAttestorPublicKey: string;
  zkVerifierPublicKey: string;
  validFrom: number;
  validUntil: number;
  active: boolean;
};

export type GigstarkComputeReceipt = {
  policyId: string;
  audience: string;
  jobId: string;
  inputCommitment: string;
  evidenceCommitment: string;
  resultCommitment: string;
  outcome: ComputeOutcome;
  attestationCommitment: string;
  proofCommitment: string;
  scopeNullifier: string;
  issuedAt: number;
  expiresAt: number;
  teeSignature: string;
  zkSignature: string;
};

export type GigstarkComputeVerifier = {
  usedNullifiers: Set<string>;
};

export function createComputePolicy(
  input: Omit<GigstarkComputePolicy, "active">,
): GigstarkComputePolicy {
  if (
    !input.id ||
    !input.audience ||
    !input.programMeasurement ||
    !input.computePolicyHash ||
    !input.teeAttestorPublicKey ||
    !input.zkVerifierPublicKey ||
    input.teeAttestorPublicKey === input.zkVerifierPublicKey ||
    input.validUntil <= input.validFrom
  ) {
    throw new Error("INVALID_COMPUTE_POLICY");
  }
  return { ...input, active: true };
}

export function createComputeVerifier(): GigstarkComputeVerifier {
  return { usedNullifiers: new Set() };
}

/**
 * Models the public binding and anti-replay checks used by the Cairo verifier.
 * Signature strings are opaque in this browser model; the Cairo contract
 * performs the actual Stark-curve signature verification.
 */
export function verifyComputeReceipt(
  verifier: GigstarkComputeVerifier,
  policy: GigstarkComputePolicy,
  receipt: GigstarkComputeReceipt,
  expectedJobId: string,
  expectedInputCommitment: string,
  now: number,
): ComputeOutcome {
  if (!policy.active || now < policy.validFrom || now >= policy.validUntil) {
    throw new Error("COMPUTE_POLICY_INACTIVE");
  }
  if (receipt.policyId !== policy.id || receipt.audience !== policy.audience) {
    throw new Error("COMPUTE_BINDING_MISMATCH");
  }
  if (receipt.jobId !== expectedJobId || receipt.inputCommitment !== expectedInputCommitment) {
    throw new Error("COMPUTE_JOB_INPUT_MISMATCH");
  }
  if (
    !receipt.evidenceCommitment ||
    !receipt.resultCommitment ||
    !receipt.attestationCommitment ||
    !receipt.proofCommitment ||
    !receipt.scopeNullifier ||
    !receipt.teeSignature ||
    !receipt.zkSignature ||
    (receipt.outcome !== "buyer" && receipt.outcome !== "seller") ||
    receipt.issuedAt < policy.validFrom ||
    receipt.issuedAt > now ||
    receipt.expiresAt <= now ||
    receipt.expiresAt > policy.validUntil
  ) {
    throw new Error("INVALID_COMPUTE_RECEIPT");
  }

  const replayKey = `${policy.id}:${receipt.scopeNullifier}`;
  if (verifier.usedNullifiers.has(replayKey)) throw new Error("COMPUTE_NULLIFIER_REPLAY");
  verifier.usedNullifiers.add(replayKey);
  return receipt.outcome;
}
