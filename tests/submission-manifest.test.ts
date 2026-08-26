import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

type SubmissionManifest = {
  transactions: unknown;
  contracts: unknown;
  demo_video: unknown;
  demo_url: unknown;
};

async function readJson(path: string): Promise<SubmissionManifest> {
  return JSON.parse(await readFile(path, "utf8")) as SubmissionManifest;
}

test("repository and public STRK20 submission manifests stay identical and honest", async () => {
  const [repositoryManifest, publicManifest] = await Promise.all([
    readJson("strk20.json"),
    readJson("public/strk20.json"),
  ]);

  assert.deepEqual(publicManifest, repositoryManifest);
  assert.deepEqual(repositoryManifest.transactions, []);
  assert.deepEqual(repositoryManifest.contracts, []);
  assert.equal(repositoryManifest.demo_video, "");
  assert.equal(repositoryManifest.demo_url, "https://gigstark.pages.dev");
});
