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
import { Key, Trash2, Plus, ShieldAlert } from "lucide-react";
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
  });
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
        });
      }
      if (keys) setApiKeys(keys as ApiKeyRow[]);
    })();
  }, [user]);

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
    setSavingPrefs(true);
    const { error } = await supabase.from("notification_prefs").upsert({
      user_id: user.id,
      ...prefs,
    });
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
            <Button onClick={savePrefs} disabled={savingPrefs}>
              {savingPrefs ? "Saving…" : "Save preferences"}
            </Button>
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
