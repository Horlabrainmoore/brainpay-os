import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = { ...corsHeaders, "Access-Control-Allow-Headers": (corsHeaders as any)["Access-Control-Allow-Headers"] + ", x-correlation-id" };

function b64(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin);
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return b64(sig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const {
      apiKey,
      environment = "sandbox",
      currencyCode,
      defaultCurrencyCode,
      showOnlyCurrencies,
      walletAddress,
      unsupportedRegionRedirectUrl,
      skipUnsupportedRegionScreen,
      redirectURL,
    } = body ?? {};

    if (!apiKey || typeof apiKey !== "string") {
      return new Response(JSON.stringify({ error: "apiKey required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("MOONPAY_SECRET_KEY");
    if (!secret) {
      return new Response(JSON.stringify({ error: "MOONPAY_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const base =
      environment === "production"
        ? "https://buy.moonpay.com"
        : "https://buy-sandbox.moonpay.com";

    const params = new URLSearchParams();
    params.set("apiKey", apiKey);
    if (currencyCode) params.set("currencyCode", currencyCode);
    if (defaultCurrencyCode) params.set("defaultCurrencyCode", defaultCurrencyCode);
    if (showOnlyCurrencies) params.set("showOnlyCurrencies", showOnlyCurrencies);
    if (walletAddress) params.set("walletAddress", walletAddress);
    if (unsupportedRegionRedirectUrl) params.set("unsupportedRegionRedirectUrl", unsupportedRegionRedirectUrl);
    if (typeof skipUnsupportedRegionScreen === "boolean") {
      params.set("skipUnsupportedRegionScreen", skipUnsupportedRegionScreen ? "true" : "false");
    }
    if (redirectURL) params.set("redirectURL", redirectURL);

    const query = "?" + params.toString();
    const signature = await sign(secret, query);
    const signed = `${base}${query}&signature=${encodeURIComponent(signature)}`;

    return new Response(JSON.stringify({ url: signed }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
