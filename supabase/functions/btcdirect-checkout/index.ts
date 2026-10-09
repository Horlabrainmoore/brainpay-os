import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

// BTC Direct fiat-to-coin checkout (sandbox). Authenticates server-side with partner
// credentials and creates a hosted checkout session.
const API = "https://api-sandbox.btcdirect.eu";
const USER = Deno.env.get("BTCDIRECT_SANDBOX_USERNAME") ?? "";
const PASS = Deno.env.get("BTCDIRECT_SANDBOX_PASSWORD") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const Body = z.object({
  baseCurrency: z.literal("BTC"),
  quoteCurrency: z.literal("EUR"),
  paymentMethod: z.string().regex(/^[A-Za-z0-9_-]{2,40}$/),
  quoteCurrencyAmount: z.number().positive().max(100000),
  walletAddress: z.string().trim().regex(/^(bc1[a-z0-9]{39,59}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/, "A Bitcoin mainnet address is required"),
  returnUrl: z.string().url().max(500),
});

let cached: { token: string; exp: number } | null = null;
async function token(): Promise<string> {
  if (cached && cached.exp > Date.now()) return cached.token;
  const r = await fetch(`${API}/api/v1/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`BTC Direct sign-in failed (HTTP ${r.status}): ${t.slice(0, 200)}`);
  const j = JSON.parse(t);
  cached = { token: j.token, exp: Date.now() + 50 * 60 * 1000 };
  return j.token;
}

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "The secure purchase service is not configured." }, 503);
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const { data: u } = await admin.auth.getUser(auth.slice(7));
  if (!u.user) return json({ error: "Unauthorized" }, 401);
  if (!USER || !PASS) return json({ error: "BTC Direct sandbox credentials are not configured yet." }, 503);

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid order details", details: JSON.stringify(parsed.error.flatten().fieldErrors) }, 400);
  const order = parsed.data;
  const apiUrl = new URL(API);
  if (apiUrl.protocol !== "https:" || !apiUrl.hostname.endsWith(".btcdirect.eu")) {
    return json({ error: "The configured BTC Direct live API address is invalid." });
  }
  const returnUrl = new URL(order.returnUrl);
  const allowedReturnHosts = new Set(["brainpay-os.lovable.app", "id-preview--a235ec03-0f1c-41ca-ae58-7e66f78d23ea.lovable.app"]);
  if (returnUrl.protocol !== "https:" || !allowedReturnHosts.has(returnUrl.hostname) || returnUrl.pathname !== "/buy") {
    return json({ error: "The return address must point back to the BrainPay Buy page." }, 400);
  }
  const partnerOrderIdentifier = crypto.randomUUID();

  try {
    const r = await fetch(`${API}/api/v2/buy/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
      body: JSON.stringify({ ...order, returnUrl: returnUrl.href, partnerOrderIdentifier }),
    });
    const text = await r.text();
    if (r.status === 401) cached = null;
    if (!r.ok) {
      console.error(`btcdirect checkout failed [${r.status}]: ${text}`);
      return json({ error: `BTC Direct rejected the order (HTTP ${r.status})`, details: text.slice(0, 400) });
    }
    const data = JSON.parse(text);
    let checkoutUrl: URL;
    try { checkoutUrl = new URL(data.checkoutUrl); } catch { return json({ error: "BTC Direct returned an invalid checkout address." }); }
    if (checkoutUrl.protocol !== "https:" || !checkoutUrl.hostname.endsWith(".btcdirect.eu")) {
      return json({ error: "BTC Direct returned an unexpected checkout address." });
    }
    const { error: transactionError } = await admin.from("transactions").insert({
      user_id: u.user.id, type: "buy", asset: order.baseCurrency, amount: 0,
      usd_value: 0, status: "pending",
      description: `BTC Direct buy €${order.quoteCurrencyAmount} of ${order.baseCurrency} (${order.paymentMethod})`,
      metadata: { provider: "btcdirect", partnerOrderIdentifier, quoteCurrencyAmount: order.quoteCurrencyAmount, walletAddress: order.walletAddress },
    });
    if (transactionError) throw new Error("Checkout was created but could not be recorded in your transaction history. Please contact support before retrying.");
    return json({ data: { checkoutUrl: checkoutUrl.href, partnerOrderIdentifier } });
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    console.error("btcdirect error", m);
    return json({ error: m });
  }
});
