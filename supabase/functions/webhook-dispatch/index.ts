// Dispatches a webhook to the user's configured URL with retry + capped backoff.
// Logs every attempt to public.webhook_deliveries.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_ATTEMPTS = 4;
// Capped exponential backoff (ms): 1s, 4s, 15s
const BACKOFF_MS = [1_000, 4_000, 15_000];
const EVENT_TO_FLAG: Record<string, string> = {
  trade: "notify_trade",
  payment: "notify_payment",
  wallet_tx: "notify_wallet_tx",
  test: "", // always allowed
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const eventType: string = body?.event_type ?? "test";
    const payload = body?.payload ?? { sample: true, message: "Test webhook from BrainPay" };

    if (!(eventType in EVENT_TO_FLAG)) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: prefs } = await admin
      .from("notification_prefs")
      .select("webhook_url, webhook_secret, notify_trade, notify_payment, notify_wallet_tx")
      .eq("user_id", userId)
      .maybeSingle();

    const url = prefs?.webhook_url;
    const secret: string | null = (prefs as any)?.webhook_secret ?? null;
    if (!url) {
      return new Response(JSON.stringify({ error: "No webhook URL configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const flag = EVENT_TO_FLAG[eventType];
    if (flag && !(prefs as any)?.[flag]) {
      return new Response(JSON.stringify({ error: `Event ${eventType} disabled in preferences` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const eventBody = {
      event_type: eventType,
      timestamp: new Date().toISOString(),
      user_id: userId,
      data: payload,
    };
    const rawBody = JSON.stringify(eventBody);

    // HMAC-SHA256 signature over `${timestamp}.${rawBody}` (Stripe-style)
    const sigTimestamp = Math.floor(Date.now() / 1000).toString();
    let signatureHex: string | null = null;
    if (secret && secret.length > 0) {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(`${sigTimestamp}.${rawBody}`),
      );
      signatureHex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    const { data: deliveryRow, error: insertErr } = await admin
      .from("webhook_deliveries")
      .insert({
        user_id: userId,
        url,
        event_type: eventType,
        payload: eventBody,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    const deliveryId = deliveryRow.id;

    let attempts = 0;
    let httpStatus: number | null = null;
    let responseSummary: string | null = null;
    let errMsg: string | null = null;
    let success = false;

    while (attempts < MAX_ATTEMPTS) {
      attempts++;
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), 10_000);
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "BrainPay-Webhook/1.0",
          "X-BrainPay-Event": eventType,
          "X-BrainPay-Timestamp": sigTimestamp,
        };
        if (signatureHex) {
          headers["X-BrainPay-Signature"] = `sha256=${signatureHex}`;
          headers["X-BrainPay-Signature-Version"] = "v1";
        }
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: rawBody,
          signal: ac.signal,
        });
        clearTimeout(timer);
        httpStatus = resp.status;
        const text = await resp.text();
        responseSummary = text.slice(0, 500);
        if (resp.ok) {
          success = true;
          errMsg = null;
          break;
        }
        errMsg = `HTTP ${resp.status}`;
      } catch (e: any) {
        errMsg = e?.message ?? String(e);
      }
      if (attempts < MAX_ATTEMPTS) {
        const wait = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)];
        await new Promise((r) => setTimeout(r, wait));
      }
    }


    await admin
      .from("webhook_deliveries")
      .update({
        status: success ? "delivered" : "failed",
        http_status: httpStatus,
        response_summary: responseSummary,
        error: errMsg,
        attempts,
        last_attempt_at: new Date().toISOString(),
        next_retry_at: null,
      })
      .eq("id", deliveryId);

    return new Response(
      JSON.stringify({
        ok: success,
        delivery_id: deliveryId,
        attempts,
        http_status: httpStatus,
        response_summary: responseSummary,
        error: errMsg,
      }),
      {
        status: success ? 200 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
