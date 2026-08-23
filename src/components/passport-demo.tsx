"use client";

import { useState } from "react";
import { createGigstarkPassportPolicy, createGigstarkPassportVerifier, verifyGigstarkPassport } from "../lib/gigstark-passport";
import styles from "./tier-demo.module.css";

const now = 1_900;
const policy = createGigstarkPassportPolicy({ id: "gigstark:passport:studio:v1", audience: "gigstark:studio", purpose: "creator-tier-access", credentialClass: "creator-membership", validFrom: 1_800, validUntil: 2_000 });

export function PassportDemo() {
  const [verifier] = useState(createGigstarkPassportVerifier);
  const [message, setMessage] = useState("No Passport claim checked. This app does not inspect a wallet.");
  const verify = () => {
    try { verifyGigstarkPassport(verifier, policy, { policyId: policy.id, audience: policy.audience, purpose: policy.purpose, credentialClass: policy.credentialClass, proofCommitment: "opaque-proof:7ac", disclosureCommitment: "studio-tier", scopeNullifier: "studio-scope:42", issuedAt: 1_890, expiresAt: 1_950, nonce: "passport-claim:1" }, now); setMessage("GigstarkPassport accepted the minimum-disclosure claim for this audience."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "PASSPORT_REJECTED"); }
  };
  return <section className={styles.panel}><p className="eyebrow">GigstarkPassport</p><h2>Purpose-bound private access.</h2><p>Only an opaque proof commitment, a scoped replay value, purpose, audience, and expiry are evaluated. No identity document, wallet history, witness, or Athera contract is involved.</p><button onClick={verify}>Verify demo Passport claim</button><p className={styles.notice} role="status">{message}</p></section>;
}
