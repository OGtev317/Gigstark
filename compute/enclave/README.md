# AWS Nitro Enclaves dispute program

The enclave program accepts one length-bounded JSON dispute request, evaluates
the public threshold policy over a private score, and returns only commitments,
the winner outcome, and expiry. Local fixture generation uses `--stdio-once`;
the enclave runtime listens on VSOCK port `5005`.

The builder is pinned to Rust `1.97.1`, Alpine `3.23`, `linux/amd64`, the exact
base-image digest in `Dockerfile`, and the dependency versions in `Cargo.lock`.
The final image is `scratch` plus one static non-root binary.

Local validation:

```sh
cargo test --locked
docker build --platform linux/amd64 --provenance=false \
  --tag gigstark-dispute-enclave:0.1.0 .
docker run --platform linux/amd64 --rm -i \
  gigstark-dispute-enclave:0.1.0 --stdio-once \
  < ../zk/fixtures/dispute-seller.request.json
```

EIF generation must run on Linux with Nitro CLI `1.5.0`:

```sh
./build-eif.sh
./run-non-debug.sh
```

`run-non-debug.sh` deliberately omits `--debug-mode`. Do not add credentials,
wallet keys, note state, or real dispute evidence to this image or repository.
