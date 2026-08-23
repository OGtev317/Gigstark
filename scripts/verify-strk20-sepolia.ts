import {
  STRK20_OBSERVED_POOL_CLASS_HASH,
  STRK20_REPRODUCED_V2_POOL_CLASS_HASH,
  STRK20_REVIEWED_POOL_CLASS_HASH,
  STRK20_SEPOLIA_POOL,
} from "../src/lib/strk20-sepolia";

const rpcUrl =
  process.env.GIGSTARK_SEPOLIA_RPC ?? "https://api.cartridge.gg/x/starknet/sepolia";

type RpcResponse<T> = { result?: T; error?: { code: number; message: string } };

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
  });
  if (!response.ok) throw new Error(`RPC_HTTP_${response.status}`);
  const payload = (await response.json()) as RpcResponse<T>;
  if (payload.error) throw new Error(`RPC_${payload.error.code}:${payload.error.message}`);
  if (payload.result === undefined) throw new Error(`RPC_MISSING_RESULT:${method}`);
  return payload.result;
}

function sameFelt(left: string, right: string): boolean {
  return BigInt(left) === BigInt(right);
}

async function main() {
  const [chainId, blockNumber, classHash] = await Promise.all([
    rpc<string>("starknet_chainId", []),
    rpc<number>("starknet_blockNumber", []),
    rpc<string>("starknet_getClassHashAt", ["latest", STRK20_SEPOLIA_POOL]),
  ]);
  const expectedChainId = "0x534e5f5345504f4c4941";
  if (!sameFelt(chainId, expectedChainId)) throw new Error("WRONG_STARKNET_CHAIN");

  const reviewedRc0 = sameFelt(classHash, STRK20_REVIEWED_POOL_CLASS_HASH);
  const reproducedV2 = sameFelt(classHash, STRK20_REPRODUCED_V2_POOL_CLASS_HASH);
  const knownObserved = sameFelt(classHash, STRK20_OBSERVED_POOL_CLASS_HASH);
  console.log(
    JSON.stringify(
      {
        network: "SN_SEPOLIA",
        blockNumber,
        pool: STRK20_SEPOLIA_POOL,
        classHash,
        reviewedRc0,
        reproducedV2,
        knownObserved,
      },
      null,
      2,
    ),
  );

  if (!reviewedRc0) {
    throw new Error("STRK20_POOL_CLASS_UNREVIEWED");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "STRK20_POOL_CHECK_FAILED");
  process.exitCode = 2;
});
