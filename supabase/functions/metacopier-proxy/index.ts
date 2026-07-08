import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const BASE = "https://api.metacopier.io";

interface ProxyBody {
  path: string;
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { data } = await admin.auth.getUser(auth.slice(7));
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function logRow(row: {
  correlation_id: string;
  user_id: string | null;
  path: string;
  method: string;
  status: number | null;
  ok: boolean;
  duration_ms: number;
  error: string | null;
}) {
  try {
    await admin.from("metacopier_proxy_logs").insert(row);
  } catch (e) {
    console.error("proxy log insert failed", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const correlationId =
    req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const started = Date.now();
  const userId = await getUserId(req);
  const responseHeaders = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "x-correlation-id": correlationId,
  };

  const apiKey = Deno.env.get("METACOPIER_API_KEY");
  if (!apiKey) {
    await logRow({
      correlation_id: correlationId, user_id: userId, path: "-", method: "-",
      status: 500, ok: false, duration_ms: Date.now() - started,
      error: "METACOPIER_API_KEY not configured",
    });
    return new Response(
      JSON.stringify({ error: "METACOPIER_API_KEY is not configured", correlationId }),
      { status: 500, headers: responseHeaders },
    );
  }

  let payload: ProxyBody;
  try {
    payload = await req.json();
  } catch {
    await logRow({
      correlation_id: correlationId, user_id: userId, path: "-", method: "-",
      status: 400, ok: false, duration_ms: Date.now() - started,
      error: "Invalid JSON body",
    });
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", correlationId }),
      { status: 400, headers: responseHeaders },
    );
  }

  if (!payload?.path || typeof payload.path !== "string" || !payload.path.startsWith("/rest/")) {
    await logRow({
      correlation_id: correlationId, user_id: userId,
      path: String(payload?.path ?? "-"), method: payload?.method ?? "-",
      status: 400, ok: false, duration_ms: Date.now() - started,
      error: "path must start with /rest/",
    });
    return new Response(
      JSON.stringify({ error: "`path` must start with /rest/", correlationId }),
      { status: 400, headers: responseHeaders },
    );
  }

  const method = (payload.method ?? "GET").toUpperCase();
  const url = new URL(BASE + payload.path);
  if (payload.query) {
    for (const [k, v] of Object.entries(payload.query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const init: RequestInit = {
    method,
    headers: {
      "X-API-KEY": apiKey,
      "Accept": "application/json",
      "x-correlation-id": correlationId,
      ...(payload.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
  };
  if (payload.body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body = JSON.stringify(payload.body);
  }

  try {
    const upstream = await fetch(url.toString(), init);
    const text = await upstream.text();
    let data: unknown = text;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    await logRow({
      correlation_id: correlationId, user_id: userId, path: payload.path, method,
      status: upstream.status, ok: upstream.ok, duration_ms: Date.now() - started,
      error: upstream.ok ? null : (typeof data === "string" ? data.slice(0, 500) : JSON.stringify(data).slice(0, 500)),
    });

    return new Response(
      JSON.stringify({ status: upstream.status, ok: upstream.ok, data, correlationId }),
      { status: 200, headers: responseHeaders },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logRow({
      correlation_id: correlationId, user_id: userId, path: payload.path, method,
      status: 502, ok: false, duration_ms: Date.now() - started, error: message,
    });
    return new Response(
      JSON.stringify({ error: message, correlationId }),
      { status: 502, headers: responseHeaders },
    );
  }
});
