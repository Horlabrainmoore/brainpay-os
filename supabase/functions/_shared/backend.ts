// Shared server helpers: CORS, auth + admin gate, Telegram gateway access.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

export { corsHeaders };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export interface AuthContext {
  userId: string;
  client: SupabaseClient; // service-role client
}

// Verifies the caller's JWT and requires the 'admin' role in public.user_roles.
export async function requireAdmin(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return jsonResponse({ error: "Unauthorized" }, 401);

  const admin = serviceClient();
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id);
  if (!roles?.some((r: { role: string }) => r.role === "admin")) {
    return jsonResponse({ error: "Forbidden: admin role required" }, 403);
  }
  return { userId: data.user.id, client: admin };
}

// Dedicated inbox bot: routed through the Lovable connector gateway.
export const TELEGRAM_GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export function telegramConnectionKey(): string {
  const key = Deno.env.get("TELEGRAM_API_KEY_1");
  if (!key) throw new Error("TELEGRAM_API_KEY_1 is not configured (dedicated Telegram connection not linked)");
  return key;
}

export interface TelegramResult {
  ok: boolean;
  status: number;
  result?: unknown;
  description?: string;
}

export async function telegramApi(method: string, body: unknown): Promise<TelegramResult> {
  const response = await fetch(`${TELEGRAM_GATEWAY_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": telegramConnectionKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: { ok?: boolean; result?: unknown; description?: string } = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    // Non-JSON provider error; surface it raw.
  }
  return {
    ok: Boolean(parsed.ok) && response.ok,
    status: response.status,
    result: parsed.result,
    description: parsed.description ?? (parsed.ok === false ? text.slice(0, 300) : undefined),
  };
}

// Shared secret for Telegram's X-Telegram-Bot-Api-Secret-Token header.
export async function deriveTelegramWebhookSecret(apiKey: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-inbox:${apiKey}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function safeEqual(a: string | null, b: string): boolean {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
