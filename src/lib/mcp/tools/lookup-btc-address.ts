import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "lookup_btc_address",
  title: "Lookup BTC address",
  description: "Fetch on-chain stats (balance, tx count) for a Bitcoin address from mempool.space.",
  inputSchema: {
    address: z.string().trim().min(10).max(120).describe("Bitcoin address (P2PKH, P2SH, Bech32, or Taproot)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ address }) => {
    const res = await fetch(`https://mempool.space/api/address/${encodeURIComponent(address)}`);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `mempool.space error ${res.status}` }],
        isError: true,
      };
    }
    const info = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(info) }],
      structuredContent: { address: info },
    };
  },
});
