import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Public REST API (2018-09-25) proxy.
// Public endpoints are open; SIGNED endpoints (TRADE / USER_DATA) are HMAC-SHA256 signed
// server-side with EXCHANGE_SECRET_KEY and never expose keys to the browser.

const BASE = (Deno.env.get("EXCHANGE_BASE_URL") ?? "").replace(/\/$/, "");
const API_KEY = Deno.env.get("EXCHANGE_API_KEY") ?? "";
const SECRET_KEY = Deno.env.get("EXCHANGE_SECRET_KEY") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Params = Record<string, string | number | boolean | null | undefined>;

interface Body {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Params;
  signed?: boolean;
  apiKeyOnly?: boolean;
  recvWindow?: number;
}

function toQuery(params: Params): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!BASE) {
    return json({ error: "EXCHANGE_BASE_URL is not configured" }, 500);
  }

  // Require an app session — the proxy holds shared exchange credentials.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
  const { data: userData } = await admin.auth.getUser(authHeader.slice(7));
  if (!userData.user) return json({ error: "Unauthorized" }, 401);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const path = typeof body.path === "string" ? body.path : "";
  if (!path.startsWith("/openapi/")) {
    return json({ error: "path must start with /openapi/" }, 400);
  }
  const method = (body.method ?? "GET").toUpperCase() as Body["method"];
  const params: Params = { ...(body.params ?? {}) };

  if (body.signed) {
    if (!API_KEY || !SECRET_KEY) return json({ error: "Exchange API credentials are not configured" }, 500);
    params.timestamp = Date.now();
    params.recvWindow = body.recvWindow ?? 5000;
  }

  let query = toQuery(params);
  if (body.signed) {
    const signature = await hmacSha256Hex(SECRET_KEY, query);
    query = `${query}&signature=${signature}`;
  }

  const url = `${BASE}${path}${query ? `?${query}` : ""}`;
  const headers: Record<string, string> = {};
  if (body.signed || body.apiKeyOnly) {
    if (!API_KEY) return json({ error: "EXCHANGE_API_KEY is not configured" }, 500);
    headers["X-BH-APIKEY"] = API_KEY;
  }

  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers });
    const text = await res.text();
    const durationMs = Date.now() - started;

    if (!res.ok) {
      console.error(`exchange ${method} ${path} failed [${res.status}]: ${text}`);
      // 429/418 are rate limits — surface them so the client backs off.
      return json({ error: "Exchange request failed", status: res.status, details: text, durationMs }, res.status);
    }

    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch { /* non-JSON body */ }
    return json({ data, status: res.status, durationMs });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("exchange proxy error", message);
    return json({ error: message }, 502);
  }
});
