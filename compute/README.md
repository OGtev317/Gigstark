# Gigstark verifiable-compute specimen

This directory contains one synthetic, end-to-end dispute specimen:

1. `enclave/` implements the canonical private dispute computation as a static
   Rust binary and pins the AWS Nitro Enclaves build/run boundary.
2. `zk/` proves the same comparison and Poseidon commitments with a BN254
   Groth16 circuit.
3. `cairo-verifier/` verifies that proof with Garaga and asserts the exact eight
   public signals returned by the enclave computation.

Run `npm run compute:verify` with the pinned Cairo tools to rebuild the
container, compare its output to the fixture, verify the Groth16 proof, and run
the Cairo valid-proof and tampered-signal tests.

This is a real proof over a synthetic witness. The proving ceremony is
deliberately local and test-only. It is not a production proving key. The
container build is reproducible and pinned, but no EIF, PCR allowlist, or AWS
attestation is checked in because those require a Linux Nitro build host and a
Nitro-enabled EC2 parent. Until that hardware run is completed, the milestone's
full TEE-attestation exit gate remains open.

No private evidence, witness, identity document, viewing key, spending key, or
wallet note state may be supplied to repository scripts or committed here.
