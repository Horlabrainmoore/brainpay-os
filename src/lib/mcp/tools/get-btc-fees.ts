import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_btc_fees",
  title: "BTC recommended fees",
  description: "Current Bitcoin recommended fee rates (sat/vB) from mempool.space.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async () => {
    const res = await fetch("https://mempool.space/api/v1/fees/recommended");
    if (!res.ok) {
      return { content: [{ type: "text", text: `mempool.space error ${res.status}` }], isError: true };
    }
    const fees = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(fees) }],
      structuredContent: { fees },
    };
  },
});
