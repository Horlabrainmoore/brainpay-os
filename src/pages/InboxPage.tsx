import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, MessageSquarePlus, Send, Sparkles, Trash2, XCircle } from "lucide-react";

interface InboxMessage {
  update_id: number;
  chat_id: number;
  sender_id: number | null;
  sender_username: string | null;
  sender_name: string | null;
  text: string | null;
  created_at: string;
}

interface Draft {
  id: string;
  draft_text: string;
  rationale: string | null;
  tone: string | null;
  status: string;
}

interface SentMessage {
  id: string;
  chat_id: number;
  text: string;
  telegram_message_id: number | null;
  status: string;
  error: string | null;
  created_at: string;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [manualText, setManualText] = useState("");
  const [manualChatId, setManualChatId] = useState("");

  const load = useCallback(async () => {
    const [{ data: msgs }, { data: sentMsgs }] = await Promise.all([
      supabase.from("telegram_inbox_messages").select("*").order("update_id", { ascending: false }).limit(50),
      supabase.from("telegram_sent_messages").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (msgs) setMessages(msgs as InboxMessage[]);
    if (sentMsgs) setSent(sentMsgs as SentMessage[]);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const selectMessage = (m: InboxMessage) => {
    setSelected(m);
    setDrafts([]);
    setReplyText("");
  };

  const draftReplies = async (text?: string, chatId?: number, updateId?: number) => {
    setDrafting(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-draft-replies", {
        body: updateId !== undefined ? { update_id: updateId } : { text, chat_id: chatId },
      });
      if (error) throw error;
      if (data?.drafts?.length) {
        setDrafts(data.drafts as Draft[]);
        toast.success(`${data.drafts.length} reply suggestions drafted`);
      } else {
        toast.error(data?.error ?? "No suggestions returned");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Drafting failed";
      toast.error(msg);
    } finally {
      setDrafting(false);
    }
  };

  const send = async (text: string, chatId: number, draftId?: string) => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-send", {
        body: { chat_id: chatId, text: text.trim(), draft_id: draftId ?? null },
      });
      if (error) {
        const details = (error as { context?: { text?: () => Promise<string> } }).context
          ? await (error as { context: { text: () => Promise<string> } }).context.text()
          : error.message;
        throw new Error(details || error.message);
      }
      if (data?.ok) {
        toast.success("Message sent");
        if (draftId) setDrafts((ds) => ds.filter((d) => d.id !== draftId));
        setReplyText("");
        await load();
      } else {
        toast.error(data?.error ?? "Send failed");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const discardDraft = async (id: string) => {
    const { error } = await supabase.from("telegram_reply_drafts").update({ status: "discarded" }).eq("id", id);
    if (!error) setDrafts((ds) => ds.filter((d) => d.id !== id));
  };

  const submitManual = async () => {
    if (!manualText.trim()) {
      toast.error("Paste the message text first");
      return;
    }
    const chatId = manualChatId.trim() ? Number(manualChatId.trim()) : undefined;
    if (manualChatId.trim() && (!Number.isFinite(chatId) || chatId === undefined)) {
      toast.error("Chat ID must be a number");
      return;
    }
    await draftReplies(manualText.trim(), chatId);
    setManualText("");
    setManualChatId("");
  };

  return (
    <DashboardLayout title="Telegram Inbox" subtitle="Dedicated BrainPay bot — incoming messages, AI-drafted replies, and send history">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Incoming messages</h3>
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No messages yet. Send a message to the bot on Telegram and it will appear here within seconds.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {messages.map((m) => (
                  <button
                    key={m.update_id}
                    onClick={() => selectMessage(m)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selected?.update_id === m.update_id
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-secondary/20 hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-foreground">
                        {m.sender_name ?? "Unknown"}
                        {m.sender_username ? ` · @${m.sender_username}` : ""}
                      </p>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.text ?? "(no text)"}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card-gradient rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Submit a message manually</h3>
            <p className="text-xs text-muted-foreground">
              Paste an incoming Telegram message to get AI reply suggestions without waiting for the inbox.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Chat ID (optional)</Label>
              <Input placeholder="e.g. 123456789" value={manualChatId} onChange={(e) => setManualChatId(e.target.value)} className="font-mono text-xs" />
            </div>
            <Textarea
              placeholder="Paste the incoming message text…"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              className="min-h-20 text-xs"
            />
            <Button size="sm" variant="outline" onClick={submitManual} disabled={drafting} className="gap-2">
              <MessageSquarePlus className="h-3.5 w-3.5" /> {drafting ? "Drafting…" : "Get AI suggestions"}
            </Button>
          </div>

          {sent.length > 0 && (
            <div className="card-gradient rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Sent history</h3>
              <div className="space-y-1.5 max-h-64 overflow-auto">
                {sent.map((s) => (
                  <div key={s.id} className="flex items-start gap-2 text-[11px] p-2 rounded bg-secondary/20 border border-border/50">
                    {s.status === "sent" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{s.text}</p>
                      <p className="text-muted-foreground">
                        chat {s.chat_id} · {new Date(s.created_at).toLocaleString()}
                        {s.error ? ` · ${s.error}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-gradient rounded-lg border border-border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Selected message</h3>
            {!selected ? (
              <p className="text-xs text-muted-foreground">Select a message from the inbox to draft a reply.</p>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">chat {selected.chat_id}</Badge>
                    <p className="text-xs text-muted-foreground">
                      {selected.sender_name ?? "Unknown"}
                      {selected.sender_username ? ` · @${selected.sender_username}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-foreground mt-2 whitespace-pre-wrap">{selected.text}</p>
                </div>
                <Button size="sm" onClick={() => draftReplies(undefined, undefined, selected.update_id)} disabled={drafting} className="gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> {drafting ? "Drafting…" : "Draft AI replies"}
                </Button>
              </>
            )}
          </div>

          {drafts.length > 0 && selected && (
            <div className="card-gradient rounded-lg border border-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Reply suggestions for review</h3>
              {drafts.map((d) => (
                <div key={d.id} className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
                  <div className="flex items-center gap-2">
                    {d.tone && <Badge variant="outline" className="text-[10px] capitalize">{d.tone}</Badge>}
                    <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto" onClick={() => discardDraft(d.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{d.draft_text}</p>
                  {d.rationale && <p className="text-[10px] text-muted-foreground">{d.rationale}</p>}
                  <Button
                    size="sm"
                    onClick={() => send(d.draft_text, selected.chat_id, d.id)}
                    disabled={sending}
                    className="gap-2"
                  >
                    <Send className="h-3 w-3" /> Approve & send
                  </Button>
                </div>
              ))}
            </div>
          )}

          {selected && (
            <div className="card-gradient rounded-lg border border-border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Write your own reply</h3>
              <Textarea
                placeholder={`Reply to chat ${selected.chat_id}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-20 text-xs"
              />
              <Button size="sm" onClick={() => send(replyText, selected.chat_id)} disabled={sending || !replyText.trim()} className="gap-2">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
