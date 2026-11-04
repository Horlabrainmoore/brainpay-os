// Sends a message as the dedicated BrainPay inbox bot and records it.
import { corsHeaders, jsonResponse, requireAdmin, telegramApi } from "../_shared/backend.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    const body = await req.json().catch(() => ({}));
    const chatId = body?.chat_id;
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const draftId = typeof body?.draft_id === "string" ? body.draft_id : null;

    if (typeof chatId !== "number" && typeof chatId !== "string") {
      return jsonResponse({ error: "chat_id is required" }, 400);
    }
    if (!text || text.length > 4096) {
      return jsonResponse({ error: "text must be 1-4096 characters" }, 400);
    }

    const result = await telegramApi("sendMessage", { chat_id: chatId, text });
    if (!result.ok) {
      return jsonResponse(
        { error: "Telegram send failed", status: result.status, details: result.description ?? "unknown" },
        502,
      );
    }
    const sentId = (result.result as { message_id?: number })?.message_id ?? null;

    const { error: insertError } = await ctx.client.from("telegram_sent_messages").insert({
      chat_id: chatId,
      text,
      telegram_message_id: sentId,
      status: "sent",
      created_by: ctx.userId,
    });
    if (insertError) {
      console.error("telegram-send insert failed:", insertError.message);
      return jsonResponse({ error: insertError.message }, 500);
    }

    if (draftId) {
      await ctx.client
        .from("telegram_reply_drafts")
        .update({ status: "sent" })
        .eq("id", draftId);
    }

    return jsonResponse({ ok: true, message_id: sentId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
