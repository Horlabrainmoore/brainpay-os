import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactionsTool from "./tools/list-transactions";
import listTradesTool from "./tools/list-trades";
import getProfileTool from "./tools/get-profile";
import getBtcFeesTool from "./tools/get-btc-fees";
import lookupBtcAddressTool from "./tools/lookup-btc-address";
import listMoonpayEventsTool from "./tools/list-moonpay-events";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "brainpay-mcp",
  title: "BrainPay OS",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in BrainPay OS user. Read their transactions, trades, profile and MoonPay events, and query on-chain BTC fees and addresses via mempool.space.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getProfileTool,
    listTransactionsTool,
    listTradesTool,
    listMoonpayEventsTool,
    getBtcFeesTool,
    lookupBtcAddressTool,
  ],
});
