import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const BASE = "https://api.metacopier.io";

interface ProxyBody {
  path: string;
  method?: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = Deno.env.get("METACOPIER_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "METACOPIER_API_KEY is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let payload: ProxyBody;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload?.path || typeof payload.path !== "string" || !payload.path.startsWith("/rest/")) {
    return new Response(
      JSON.stringify({ error: "`path` must start with /rest/" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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

    return new Response(
      JSON.stringify({ status: upstream.status, ok: upstream.ok, data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
