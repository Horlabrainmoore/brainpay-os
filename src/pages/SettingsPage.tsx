import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { encryptValue } from "@/lib/crypto";
import { toast } from "sonner";
import { Key, Trash2, Plus, ShieldAlert, Send, CheckCircle2, XCircle, Clock } from "lucide-react";
import { FirebaseDiagnostics } from "@/components/FirebaseDiagnostics";
import { z } from "zod";


const PROVIDERS = ["binance", "coinbase", "kraken", "bybit", "okx", "other"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD"];

const profileSchema = z.object({
  display_name: z.string().trim().min(1).max(80),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  preferred_currency: z.string().min(3).max(8),
  timezone: z.string().trim().max(80),
  avatar_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

const apiKeySchema = z.object({
  label: z.string().trim().min(1).max(80),
  provider: z.string().min(1),
  apiKey: z.string().trim().min(8).max(500),
  apiSecret: z.string().trim().max(500).optional().or(z.literal("")),
  passphrase: z.string().min(8, "Passphrase must be at least 8 characters").max(128),
});

interface ApiKeyRow {
  id: string;
  label: string;
  provider: string;
  encrypted_key: string;
  encrypted_secret: string | null;
  iv: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    display_name: "",
    country: "",
    preferred_currency: "USD",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    avatar_url: "",
  });
  const [prefs, setPrefs] = useState({
    email_alerts: true,
    push_alerts: false,
    trade_signals: true,
    payment_updates: true,
    security_alerts: true,
    weekly_summary: true,
    webhook_url: "",
    webhook_secret: "",
    notify_trade: true,
    notify_payment: true,
    notify_wallet_tx: true,
  });

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const lastDelivery = deliveries[0];
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [newKey, setNewKey] = useState({
    label: "",
    provider: "binance",
    apiKey: "",
    apiSecret: "",
    passphrase: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: n }, { data: keys }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("notification_prefs").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_api_keys").select("*").order("created_at", { ascending: false }),
      ]);
      if (p) {
        setProfile({
          display_name: p.display_name ?? "",
          country: p.country ?? "",
          preferred_currency: p.preferred_currency ?? "USD",
          timezone: p.timezone ?? "UTC",
          avatar_url: p.avatar_url ?? "",
        });
      }
      if (n) {
        setPrefs({
          email_alerts: n.email_alerts,
          push_alerts: n.push_alerts,
          trade_signals: n.trade_signals,
          payment_updates: n.payment_updates,
          security_alerts: n.security_alerts,
          weekly_summary: n.weekly_summary,
          webhook_url: (n as any).webhook_url ?? "",
          webhook_secret: (n as any).webhook_secret ?? "",
          notify_trade: (n as any).notify_trade ?? true,
          notify_payment: (n as any).notify_payment ?? true,
          notify_wallet_tx: (n as any).notify_wallet_tx ?? true,
        });

      }
      if (keys) setApiKeys(keys as ApiKeyRow[]);
      await loadDeliveries();
    })();
  }, [user]);

  const loadDeliveries = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("webhook_deliveries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setDeliveries(data);
  };

  const sendTestWebhook = async () => {
    if (!user) return;
    if (!prefs.webhook_url.trim()) {
      toast.error("Save a webhook URL first");
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("webhook-dispatch", {
        body: {
          event_type: "test",
          payload: { sample: true, message: "Test webhook from BrainPay Settings" },
        },
      });
      if (error) throw error;
      if (data?.ok) toast.success(`Delivered (HTTP ${data.http_status})`);
      else toast.error(`Failed after ${data?.attempts ?? "?"} attempts: ${data?.error ?? "unknown"}`);
      await loadDeliveries();
    } catch (e: any) {
      toast.error(e.message ?? "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      ...parsed.data,
      avatar_url: parsed.data.avatar_url || null,
      country: parsed.data.country || null,
    });
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const savePrefs = async () => {
    if (!user) return;
    const url = prefs.webhook_url.trim();
    if (url) {
      try {
        const u = new URL(url);
        if (u.protocol !== "https:") throw new Error("Webhook URL must use https://");
      } catch (e: any) {
        toast.error(e.message ?? "Invalid webhook URL");
        return;
      }
    }
    setSavingPrefs(true);
    const secret = prefs.webhook_secret.trim();
    if (secret && secret.length < 16) {
      toast.error("Signing secret must be at least 16 characters");
      setSavingPrefs(false);
      return;
    }
    const { error } = await supabase.from("notification_prefs").upsert({
      user_id: user.id,
      ...prefs,
      webhook_url: url || null,
      webhook_secret: secret || null,
    } as any);

    setSavingPrefs(false);
    if (error) toast.error(error.message);
    else toast.success("Preferences saved");
  };

  const addApiKey = async () => {
    if (!user) return;
    const parsed = apiKeySchema.safeParse(newKey);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSavingKey(true);
    try {
      const enc = await encryptValue(parsed.data.apiKey, parsed.data.passphrase, user.id);
      let encryptedSecret: string | null = null;
      if (parsed.data.apiSecret) {
        const encS = await encryptValue(parsed.data.apiSecret, parsed.data.passphrase, user.id);
        encryptedSecret = encS.ciphertext; // reuse same iv; store under key iv
      }
      const { error } = await supabase.from("user_api_keys").insert({
        user_id: user.id,
        label: parsed.data.label,
        provider: parsed.data.provider,
        encrypted_key: enc.ciphertext,
        encrypted_secret: encryptedSecret,
        iv: enc.iv,
      });
      if (error) throw error;
      toast.success("API key encrypted and saved");
      setNewKey({ label: "", provider: "binance", apiKey: "", apiSecret: "", passphrase: "" });
      const { data } = await supabase.from("user_api_keys").select("*").order("created_at", { ascending: false });
      if (data) setApiKeys(data as ApiKeyRow[]);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save key");
    } finally {
      setSavingKey(false);
    }
  };

  const deleteKey = async (id: string) => {
    const { error } = await supabase.from("user_api_keys").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setApiKeys((k) => k.filter((x) => x.id !== id));
      toast.success("API key deleted");
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Profile, notifications, and API keys">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>


        <TabsContent value="profile">
          <div className="card-gradient rounded-lg border border-border p-6 max-w-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Profile</h3>
              <p className="text-xs text-muted-foreground mt-1">Your account information</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Display name">
                <Input value={profile.display_name}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input value={user?.email ?? ""} disabled className="opacity-70" />
              </Field>
              <Field label="Country">
                <Input value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
              </Field>
              <Field label="Preferred currency">
                <Select value={profile.preferred_currency}
                  onValueChange={(v) => setProfile({ ...profile, preferred_currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Timezone">
                <Input value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} />
              </Field>
              <Field label="Avatar URL">
                <Input placeholder="https://…" value={profile.avatar_url}
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
              </Field>
            </div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="card-gradient rounded-lg border border-border p-6 max-w-2xl space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Notification preferences</h3>
              <p className="text-xs text-muted-foreground mt-1">Choose what you'd like to be alerted about</p>
            </div>
            <div className="space-y-3">
              {([
                ["email_alerts", "Email alerts", "Receive important updates by email"],
                ["push_alerts", "Push notifications", "Browser push for real-time alerts"],
                ["trade_signals", "Trade signals", "Notify me when AI generates a high-confidence signal"],
                ["payment_updates", "Payment updates", "Status of outgoing and incoming payments"],
                ["security_alerts", "Security alerts", "New device sign-ins and account activity"],
                ["weekly_summary", "Weekly summary", "Portfolio recap every Monday"],
              ] as const).map(([key, title, desc]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground">Transaction updates webhook URL</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="url"
                    placeholder="https://webhook.finchpay.io/transaction_updates"
                    value={prefs.webhook_url}
                    onChange={(e) => setPrefs({ ...prefs, webhook_url: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={sendTestWebhook} disabled={testing} className="gap-2 shrink-0">
                    <Send className="h-4 w-4" /> {testing ? "Sending…" : "Test"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Optional. Events POST as JSON with retry + capped backoff (up to 4 attempts).
                </p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">HMAC signing secret (optional)</Label>
                <Input
                  type="password"
                  placeholder="whsec_… (min 16 chars)"
                  value={prefs.webhook_secret}
                  onChange={(e) => setPrefs({ ...prefs, webhook_secret: e.target.value })}
                  className="mt-1.5 font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requests are signed as <code className="font-mono">X-BrainPay-Signature: sha256=HMAC(secret, `${"{"}timestamp{"}"}.{"{"}body{"}"})</code>.
                  Timestamp sent in <code className="font-mono">X-BrainPay-Timestamp</code> (unix seconds).
                </p>
              </div>


              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Webhook event triggers</p>
                {([
                  ["notify_trade", "Trade updates", "New trades, fills, and closed positions"],
                  ["notify_payment", "Payment updates", "Outgoing and incoming payment status changes"],
                  ["notify_wallet_tx", "Wallet transaction updates", "On-chain BTC tx detected for tracked addresses"],
                ] as const).map(([key, title, desc]) => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-md bg-secondary/30 border border-border">
                    <div>
                      <p className="text-xs font-medium text-foreground">{title}</p>
                      <p className="text-[11px] text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(v) => setPrefs({ ...prefs, [key]: v })}
                    />
                  </div>
                ))}
              </div>

              {lastDelivery && (
                <div className="rounded-md border border-border bg-secondary/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    {lastDelivery.status === "delivered" ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : lastDelivery.status === "failed" ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-xs font-medium text-foreground">
                      Last delivery · {lastDelivery.event_type} · HTTP {lastDelivery.http_status ?? "—"}
                    </p>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {new Date(lastDelivery.last_attempt_at ?? lastDelivery.created_at).toLocaleString()}
                    </span>
                  </div>
                  {lastDelivery.response_summary && (
                    <pre className="text-[11px] text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-24 overflow-auto">
                      {lastDelivery.response_summary}
                    </pre>
                  )}
                  {lastDelivery.error && (
                    <p className="text-[11px] text-destructive">{lastDelivery.error}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">attempts: {lastDelivery.attempts}</p>
                </div>
              )}
            </div>
            <Button onClick={savePrefs} disabled={savingPrefs}>
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>

            {deliveries.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-foreground mb-2">Recent webhook deliveries</h4>
                <div className="space-y-1.5 max-h-64 overflow-auto">
                  {deliveries.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 text-[11px] p-2 rounded bg-secondary/20 border border-border/50">
                      {d.status === "delivered" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      )}
                      <span className="font-mono text-muted-foreground">{d.event_type}</span>
                      <span className="text-muted-foreground">HTTP {d.http_status ?? "—"}</span>
                      <span className="text-muted-foreground">×{d.attempts}</span>
                      <span className="ml-auto text-muted-foreground">
                        {new Date(d.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="api-keys">
          <div className="space-y-4 max-w-3xl">
            <div className="card-gradient rounded-lg border border-border p-6 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  Your exchange API keys are <span className="text-foreground font-medium">encrypted in your browser</span> with
                  AES-GCM 256 using a passphrase only you know. We never see your passphrase or the plaintext keys.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Label">
                  <Input placeholder="e.g. Binance Spot" value={newKey.label}
                    onChange={(e) => setNewKey({ ...newKey, label: e.target.value })} />
                </Field>
                <Field label="Provider">
                  <Select value={newKey.provider}
                    onValueChange={(v) => setNewKey({ ...newKey, provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDERS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="API key">
                  <Input type="password" value={newKey.apiKey}
                    onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })} />
                </Field>
                <Field label="API secret (optional)">
                  <Input type="password" value={newKey.apiSecret}
                    onChange={(e) => setNewKey({ ...newKey, apiSecret: e.target.value })} />
                </Field>
                <Field label="Encryption passphrase">
                  <Input type="password" placeholder="Min 8 chars" value={newKey.passphrase}
                    onChange={(e) => setNewKey({ ...newKey, passphrase: e.target.value })} />
                </Field>
              </div>
              <Button onClick={addApiKey} disabled={savingKey} className="gap-2">
                <Plus className="h-4 w-4" /> {savingKey ? "Encrypting…" : "Add API key"}
              </Button>
            </div>

            <div className="card-gradient rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Stored keys</h3>
              {apiKeys.length === 0 ? (
                <p className="text-xs text-muted-foreground">No API keys yet.</p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
                      <Key className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{k.label}</p>
                        <p className="text-[11px] text-muted-foreground capitalize font-mono">
                          {k.provider} · added {new Date(k.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <code className="text-[10px] text-muted-foreground font-mono hidden sm:block max-w-[120px] truncate">
                        {k.encrypted_key.slice(0, 16)}…
                      </code>
                      <Button size="icon" variant="ghost" onClick={() => deleteKey(k.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="diagnostics">
          <FirebaseDiagnostics />
        </TabsContent>
      </Tabs>

    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
