// Drafts context-aware reply suggestions for incoming Telegram messages
// using Lovable AI (server-side model call, never exposed to the browser).
import { createOpenAI } from "npm:@ai-sdk/openai@^2";
import { streamObject } from "npm:ai@^5";
import { z } from "npm:zod@^3";
import { corsHeaders, jsonResponse, requireAdmin, serviceClient } from "../_shared/backend.ts";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "../_shared/run-id.ts";

const draftSchema = z.strictObject({
  drafts: z
    .array(
      z.strictObject({
        reply: z.string().min(1).max(1000),
        rationale: z.string().min(1).max(500),
        tone: z.string().min(1).max(40),
      }),
    )
    .min(2)
    .max(3),
});

const SYSTEM = [
  "You draft reply suggestions for BrainPay, a Bitcoin payments company, responding to messages in its Telegram support inbox.",
  "Given the selected incoming message and the recent conversation history, suggest 2-3 short, context-aware replies.",
  "Each suggestion must be safe to send as-is, address the specific request, stay under 400 characters, and include a one-line rationale plus a tone label (e.g. professional, friendly, concise).",
  "Never invent balances, transaction hashes, or refunds. If information is missing, the reply should ask for it.",
  "Respond in JSON matching the requested schema.",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) return ctx;

    const body = await req.json().catch(() => ({}));
    const updateId = typeof body?.update_id === "number" ? body.update_id : null;
    const manualText = typeof body?.text === "string" ? body.text.trim() : "";
    const chatId = typeof body?.chat_id === "number" ? body.chat_id : null;

    let messageText = manualText;
    let effectiveChatId = chatId;
    let sender: string | null = null;

    if (updateId !== null) {
      const { data: msg, error } = await ctx.client
        .from("telegram_inbox_messages")
        .select("chat_id, text, sender_name, sender_username")
        .eq("update_id", updateId)
        .maybeSingle();
      if (error) return jsonResponse({ error: error.message }, 500);
      if (!msg) return jsonResponse({ error: "Message not found" }, 404);
      if (!msg.text) return jsonResponse({ error: "That message has no text to draft against" }, 400);
      messageText = msg.text;
      effectiveChatId = msg.chat_id;
      sender = msg.sender_username ? `@${msg.sender_username}` : msg.sender_name;
    }

    if (!messageText) {
      return jsonResponse({ error: "Provide update_id or text to draft against" }, 400);
    }

    // Recent history from the same chat gives the model conversation context.
    let history: string[] = [];
    if (effectiveChatId !== null) {
      const { data: recent } = await ctx.client
        .from("telegram_inbox_messages")
        .select("text, sender_name")
        .eq("chat_id", effectiveChatId)
        .order("update_id", { ascending: false })
        .limit(5);
      history = (recent ?? [])
        .filter((m: { text: string | null }) => m.text)
        .map((m: { text: string | null; sender_name: string | null }) => `${m.sender_name ?? "User"}: ${m.text}`);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return jsonResponse({ error: "LOVABLE_API_KEY is not configured" }, 500);

    const runIdFetchRunId = getLovableAiGatewayRunId(req);
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: createLovableAiGatewayRunIdFetch(runIdFetchRunId).fetch,
    });

    const result = streamObject({
      model: provider.responses("openai/gpt-6-astra"),
      schema: draftSchema,
      system: SYSTEM,
      prompt: [
        sender ? `From: ${sender}` : "From: Telegram user",
        history.length ? `Recent conversation:\n${history.join("\n")}` : "No prior history in this chat.",
        `Selected incoming message: ${messageText}`,
      ].join("\n\n"),
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const { object } = await result;

    const rows = object.drafts.map((d) => ({
      inbox_update_id: updateId,
      draft_text: d.reply,
      rationale: d.rationale,
      tone: d.tone,
      status: "suggested",
      model: "openai/gpt-6-astra",
    }));
    const { data: inserted, error: insertError } = await ctx.client
      .from("telegram_reply_drafts")
      .insert(rows)
      .select();
    if (insertError) return jsonResponse({ error: insertError.message }, 500);

    return jsonResponse({ ok: true, drafts: inserted });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    console.error("telegram-draft-replies failed:", message);
    return jsonResponse({ error: message, status }, status >= 400 && status < 600 ? status : 500);
  }
});
