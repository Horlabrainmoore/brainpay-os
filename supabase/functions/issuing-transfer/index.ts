// Moves funds between USD Available Balance and USD Issuing Balance
// (sandbox ledger). Validation happens client- and server-side; the ledger
// mutation runs in a security-definer SQL function so balances can never be
// written directly by clients.
import { corsHeaders, jsonResponse, requireAdmin } from "../_shared/backend.ts";

const MAX_TRANSFER_USD = 1_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    const body = await req.json().catch(() => ({}));
    const amount = body?.amount;

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      return jsonResponse({ error: "Amount must be a number" }, 400);
    }
    if (amount <= 0) return jsonResponse({ error: "Amount must be greater than zero" }, 400);
    if (Math.round(amount * 100) !== amount * 100) {
      return jsonResponse({ error: "Amount supports up to 2 decimal places" }, 400);
    }
    if (amount < 1) return jsonResponse({ error: "Minimum transfer is $1" }, 400);
    if (amount > MAX_TRANSFER_USD) return jsonResponse({ error: "Maximum transfer is $1,000,000" }, 400);

    const { error: rpcError } = await ctx.client.rpc("perform_issuing_transfer", {
      p_user_id: ctx.userId,
      p_amount: amount,
    });
    if (rpcError) {
      return jsonResponse({ error: rpcError.message }, 400);
    }

    const { data: balances } = await ctx.client
      .from("issuing_balances")
      .select("available_usd, issuing_usd")
      .eq("user_id", ctx.userId)
      .maybeSingle();
    const { data: transfer } = await ctx.client
      .from("issuing_transfers")
      .select("*")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return jsonResponse({ ok: true, balances, transfer });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
