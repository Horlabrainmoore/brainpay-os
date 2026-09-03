import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { MCP_AUDIENCES, MCP_PATH, MCP_SERVER, MCP_TOOLS } from "@/lib/mcp/manifest-info";
import { Bot, Check, Copy, Loader2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";

interface ConsentRow {
  id: string;
  client_id: string | null;
  client_name: string | null;
  scopes: string | null;
  redirect_uri: string | null;
  approved: boolean;
  created_at: string;
}

const MCP_URL = `${window.location.origin}${MCP_PATH}`;
const tools = MCP_TOOLS;

export default function AgentIntegrationsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [statusDetail, setStatusDetail] = useState<string>("");
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function checkStatus() {
    setStatus("checking");
    try {
      // An unauthenticated MCP call must return 401 + WWW-Authenticate: that means
      // the server is up AND OAuth protection is active.
      const res = await fetch(MCP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      });
      if (res.status === 401) {
        setStatus("online");
        setStatusDetail("Reachable — OAuth protection active (401 for unauthenticated calls).");
      } else if (res.ok) {
        setStatus("online");
        setStatusDetail(`Reachable (HTTP ${res.status}).`);
      } else {
        setStatus("offline");
        setStatusDetail(`Unexpected response: HTTP ${res.status}.`);
      }
    } catch (e) {
      setStatus("offline");
      setStatusDetail(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadConsents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("oauth_client_consents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    setConsents((data as ConsentRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    checkStatus();
    if (user) loadConsents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function revoke(id: string) {
    const { error } = await supabase.from("oauth_client_consents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed from this list. Re-approval is required on the client's next connect.");
    loadConsents();
  }

  function copyUrl() {
    navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <DashboardLayout title="Agent integrations" subtitle="MCP server, tools and approved clients">
      <div className="space-y-6">
        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" /> MCP server status
            </CardTitle>
            <Button variant="outline" size="sm" onClick={checkStatus}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Re-check
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  status === "online"
                    ? "border-primary/40 text-primary"
                    : status === "offline"
                      ? "border-destructive/40 text-destructive"
                      : "text-muted-foreground"
                }
              >
                {status === "checking" ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking
                  </>
                ) : status === "online" ? (
                  "Online"
                ) : (
                  "Unreachable"
                )}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                {MCP_SERVER.title} · v{MCP_SERVER.version}
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                <ShieldCheck className="h-3 w-3 mr-1" /> OAuth 2.1 · aud {MCP_AUDIENCES.join(", ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{statusDetail}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono bg-secondary/50 rounded px-2 py-1.5 break-all">
                {MCP_URL}
              </code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste this URL into ChatGPT, Claude, Cursor or Codex. Clients register dynamically and you approve
              them on the consent screen; every tool call runs under your own row-level permissions.
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-base">Enabled tools ({tools.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {tools.map((t) => (
              <div key={t.name} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{t.title ?? t.name}</span>
                  <code className="text-[10px] font-mono text-muted-foreground">{t.name}</code>
                  {t.annotations?.readOnlyHint && (
                    <Badge variant="outline" className="text-[10px]">read-only</Badge>
                  )}
                  {t.annotations?.openWorldHint && (
                    <Badge variant="outline" className="text-[10px]">external</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Approved clients &amp; scopes</CardTitle>
            <Button variant="outline" size="sm" onClick={loadConsents}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : consents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clients yet. Connect an MCP client with the URL above and approve it to see it listed here.
              </p>
            ) : (
              <div className="space-y-2">
                {consents.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {c.client_name ?? "Unnamed client"}
                        </span>
                        <Badge
                          variant="outline"
                          className={c.approved ? "text-primary border-primary/40" : "text-muted-foreground"}
                        >
                          {c.approved ? "approved" : "denied"}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground break-all">
                        {c.client_id ?? "—"} · scopes: {c.scopes || "default (all tools, your data only)"}
                      </p>
                      {c.redirect_uri && (
                        <p className="text-[11px] font-mono text-muted-foreground break-all">
                          redirect: {c.redirect_uri}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => revoke(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
