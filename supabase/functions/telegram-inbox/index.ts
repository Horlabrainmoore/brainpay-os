// Telegram webhook receiver for the dedicated BrainPay inbox bot.
// verify_jwt = false (Telegram cannot send a Supabase JWT); requests are
// authenticated with the X-Telegram-Bot-Api-Secret-Token header instead.
import {
  corsHeaders,
  jsonResponse,
  serviceClient,
  telegramConnectionKey,
  deriveTelegramWebhookSecret,
  safeEqual,
} from "../_shared/backend.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const apiKey = telegramConnectionKey();
    const expected = await deriveTelegramWebhookSecret(apiKey);
    const actual = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (!safeEqual(actual, expected)) return jsonResponse({ error: "Unauthorized" }, 401);

    const update = await req.json();
    const message = update?.message ?? update?.edited_message;
    if (!message?.chat?.id || typeof update.update_id !== "number") {
      return jsonResponse({ ok: true, ignored: true });
    }

    const supabase = serviceClient();
    const { error } = await supabase.from("telegram_inbox_messages").upsert(
      {
        update_id: update.update_id,
        chat_id: message.chat.id,
        sender_id: message.from?.id ?? null,
        sender_username: message.from?.username ?? null,
        sender_name: [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || null,
        text: message.text ?? null,
        raw: update,
      },
      { onConflict: "update_id" },
    );

    if (error) {
      console.error("telegram-inbox insert failed:", error.message);
      return jsonResponse({ error: error.message }, 500);
    }
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
