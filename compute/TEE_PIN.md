# TEE pin: AWS Nitro Enclaves specimen v1

Gigstark pins the first verifiable-compute specimen to AWS Nitro Enclaves and
AWS Nitro CLI `v1.5.0`. The enclave application is a static Linux AMD64 Rust
binary. Its builder image is pinned by digest in `compute/enclave/Dockerfile`.

This local macOS workspace can compile and test the deterministic dispute
function, but it cannot claim a real enclave measurement or attestation. The
EIF must be built on Linux with `compute/enclave/build-eif.sh`, and the enclave
must be launched on an EC2 parent with Nitro Enclaves enabled using
`compute/enclave/run-non-debug.sh`.

Acceptance gates:

- `nitro-cli` reports exactly `1.5.0`;
- the image is built for `linux/amd64` from the pinned builder digest;
- `nitro-cli build-enclave` emits a 96-hex-character, non-zero PCR0;
- the enclave is launched without `--debug-mode`;
- the attestation certificate chain terminates at the reviewed AWS Nitro root;
- PCR0 equals the release allowlist;
- the attestation nonce equals the fresh job challenge;
- `user_data` binds the canonical result commitment and proof commitment;
- the attested public key belongs to the ephemeral enclave session; and
- expiry, policy, audience, job, input, and nullifier are checked again in
  Cairo before settlement.

No AWS credentials, KMS key, certificate private key, STRK20 key, wallet note,
or private evidence belongs in this repository. PCR values will only be pinned
after an independently reproduced non-debug EIF build.
