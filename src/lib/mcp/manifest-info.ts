/**
 * UI-side mirror of .lovable/mcp/manifest.json (which lives outside src and is
 * regenerated on every MCP change). Keep in sync when tools change — the
 * authoritative source is src/lib/mcp/index.ts.
 */
export const MCP_PATH = "/functions/v1/mcp";
export const MCP_SERVER = { title: "BrainPay OS", version: "0.1.0", name: "brainpay-mcp" };
export const MCP_AUDIENCES = ["authenticated"];

export interface McpToolInfo {
  name: string;
  title: string;
  description: string;
  readOnly: boolean;
  openWorld: boolean;
}

export const MCP_TOOLS: McpToolInfo[] = [
  {
    name: "get_profile",
    title: "Get my profile",
    description: "Return the signed-in user's BrainPay OS profile row.",
    readOnly: true,
    openWorld: false,
  },
  {
    name: "list_transactions",
    title: "List my transactions",
    description: "List the signed-in user's transactions, newest first.",
    readOnly: true,
    openWorld: false,
  },
  {
    name: "list_trades",
    title: "List my trades",
    description: "List the signed-in user's simulated trades, newest first.",
    readOnly: true,
    openWorld: false,
  },
  {
    name: "list_moonpay_events",
    title: "List my MoonPay events",
    description: "List the signed-in user's MoonPay widget events (purchase_started/succeeded/failed/region), newest first.",
    readOnly: true,
    openWorld: false,
  },
  {
    name: "get_btc_fees",
    title: "BTC recommended fees",
    description: "Current Bitcoin recommended fee rates (sat/vB) from mempool.space.",
    readOnly: true,
    openWorld: true,
  },
  {
    name: "lookup_btc_address",
    title: "Lookup BTC address",
    description: "Fetch on-chain stats (balance, tx count) for a Bitcoin address from mempool.space.",
    readOnly: true,
    openWorld: true,
  },
];
