"use client";

import { useState } from "react";
import { createTierPolicy, createTierVerifier, verifyTierProof } from "../lib/tier-proof";
import styles from "./tier-demo.module.css";

const now = 1_800_000_000;
const policy = createTierPolicy({ id: "gigstark:creator-access:v1", audience: "gigstark-creator-feed", tier: "studio", validFrom: now - 60, validUntil: now + 3600, requiresNullifier: true });

export function TierDemo() {
  const [verifier] = useState(createTierVerifier);
  const [message, setMessage] = useState("No proof checked. No wallet information is requested.");
  const check = () => {
    try {
      verifyTierProof(verifier, policy, { policyId: policy.id, audience: policy.audience, tier: policy.tier, proofDigest: "proof:6c1…", disclosureDigest: "tier:studio", nullifier: "scope:8a9…", issuedAt: now - 10, expiresAt: now + 300, nonce: "receipt:1" }, now);
      setMessage("Tier proof accepted for this audience and scope.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "VERIFICATION_FAILED"); }
  };
  return <section className={styles.panel}><p className="eyebrow">Passport-inspired tier verifier</p><h2>Verify access, never scan a wallet.</h2><p>The verifier accepts only a current, audience-bound Studio-tier receipt with a scoped anti-replay value. It receives no wallet history, identity, proof witness, or delivery data.</p><button onClick={check}>Verify demo tier proof</button><p className={styles.notice} role="status">{message}</p></section>;
}
