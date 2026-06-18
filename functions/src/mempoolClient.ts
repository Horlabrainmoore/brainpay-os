// functions/src/mempoolClient.ts
import fetch from "node-fetch";

const BASE = process.env.MEMPOOL_API_BASE || "https://mempool.space";

export async function fetchFeeEstimates() {
  const url = `${BASE}/api/v1/fees/recommended`;
  const res = await fetch(url, { timeout: 10_000 });
  if (!res.ok) throw new Error(`fee fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchBlocksLatest() {
  const url = `${BASE}/api/blocks`;
  const res = await fetch(url, { timeout: 10_000 });
  if (!res.ok) throw new Error(`blocks fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchBlockByHash(hash: string) {
  const url = `${BASE}/api/block/${hash}`;
  const res = await fetch(url, { timeout: 10_000 });
  if (!res.ok) throw new Error(`block fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAddress(address: string) {
  const url = `${BASE}/api/address/${address}`;
  const res = await fetch(url, { timeout: 10_000 });
  if (!res.ok) throw new Error(`address fetch failed: ${res.status}`);
  return res.json();
}
