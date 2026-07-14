import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, RefreshCw, ExternalLink } from "lucide-react";

type Settings = {
  api_key: string;
  wallet_address: string;
  currency_code: string;
  default_currency_code: string;
  show_only_currencies: string;
  unsupported_region_redirect_url: string;
  skip_unsupported_region_screen: boolean;
  environment: "sandbox" | "production";
};

const empty: Settings = {
  api_key: "",
  wallet_address: "",
  currency_code: "",
  default_currency_code: "",
  show_only_currencies: "",
  unsupported_region_redirect_url: "",
  skip_unsupported_region_screen: false,
  environment: "sandbox",
};

/** MoonPay postMessage event names we care about. */
const EVENT_TYPES = new Set([
  "purchase_started",
  "purchase_succeeded",
  "purchase_failed",
  "unsupported_region",
  "region_not_supported",
  "kyc_started",
  "kyc_completed",
]);

export default function MoonPayPage() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings>(empty);
  const [loaded, setLoaded] = useState(false);
  const [signing, setSigning] = useState(false);
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // load persisted settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("moonpay_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setS({ ...empty, ...data, environment: (data.environment as any) || "sandbox" });
      setLoaded(true);
    })();
  }, [user]);

  const save = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("moonpay_settings")
      .upsert({ user_id: user.id, ...s });
    if (error) toast.error(error.message);
    else toast.success("MoonPay settings saved");
  }, [user, s]);

  const logEvent = useCallback(
    async (event_type: string, raw: any) => {
      if (!user) return;
      await supabase.from("moonpay_events").insert({
        user_id: user.id,
        event_type,
        status: raw?.status ?? null,
        transaction_id: raw?.transactionId ?? raw?.id ?? null,
        currency_code: raw?.currencyCode ?? null,
        amount: raw?.quoteCurrencyAmount ?? raw?.amount ?? null,
        base_currency_code: raw?.baseCurrencyCode ?? null,
        base_amount: raw?.baseCurrencyAmount ?? null,
        raw,
      });
    },
    [user],
  );

  // postMessage listener
  useEffect(() => {
    const onMsg = (evt: MessageEvent) => {
      const origin = evt.origin || "";
      if (!/moonpay\.com$/.test(new URL(origin || "http://x").hostname.replace(/^www\./, ""))) {
        // permissive: MoonPay uses buy.moonpay.com / buy-sandbox.moonpay.com
        if (!/moonpay\.com/.test(origin)) return;
      }
      const data = evt.data;
      if (!data || typeof data !== "object") return;
      const type: string | undefined = data.type || data.event || data.name;
      if (!type) return;
      if (EVENT_TYPES.has(type) || type.startsWith("purchase_") || type.includes("region")) {
        logEvent(type, data.payload ?? data);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [logEvent]);

  const loadWidget = useCallback(async () => {
    if (!s.api_key) {
      toast.error("Enter your MoonPay apiKey first");
      return;
    }
    setSigning(true);
    try {
      const fallbackRedirect = `${window.location.origin}/moonpay/unsupported`;
      const { data, error } = await supabase.functions.invoke("moonpay-sign", {
        body: {
          apiKey: s.api_key,
          environment: s.environment,
          currencyCode: s.currency_code || undefined,
          defaultCurrencyCode: s.default_currency_code || undefined,
          showOnlyCurrencies: s.show_only_currencies || undefined,
          walletAddress: s.wallet_address || undefined,
          unsupportedRegionRedirectUrl: s.unsupported_region_redirect_url || fallbackRedirect,
          skipUnsupportedRegionScreen: s.skip_unsupported_region_screen,
          redirectURL: `${window.location.origin}/moonpay?status=complete`,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Signing service returned no URL");
      setWidgetUrl(data.url);
      logEvent("widget_loaded", {
        environment: s.environment,
        unsupportedRegionRedirectUrl: s.unsupported_region_redirect_url || fallbackRedirect,
        skipUnsupportedRegionScreen: s.skip_unsupported_region_screen,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to sign widget URL");
    } finally {
      setSigning(false);
    }
  }, [s, logEvent]);

  // Handle redirectURL return
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const status = p.get("status");
    const txId = p.get("transactionId");
    if (status && user) {
      logEvent("redirect_return", { status, transactionId: txId, query: Object.fromEntries(p) });
    }
  }, [user, logEvent]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const [events, setEvents] = useState<any[]>([]);
  const refreshEvents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("moonpay_events")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setEvents(data ?? []);
  }, [user]);
  useEffect(() => {
    refreshEvents();
    const t = window.setInterval(refreshEvents, 8000);
    return () => window.clearInterval(t);
  }, [refreshEvents]);

  return (
    <DashboardLayout title="MoonPay On-Ramp" subtitle="Fiat-to-crypto widget with signed URL, region redirect, and event logging">
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-sm">Widget configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="apiKey (pk_...)">
              <Input value={s.api_key} onChange={(e) => set("api_key", e.target.value)} placeholder="pk_live_... or pk_test_..." />
            </Field>
            <Field label="Environment">
              <div className="flex items-center gap-2">
                <Switch
                  checked={s.environment === "production"}
                  onCheckedChange={(v) => set("environment", v ? "production" : "sandbox")}
                />
                <span className="text-xs font-mono text-muted-foreground">{s.environment}</span>
              </div>
            </Field>
            <Field label="walletAddress (prefill)">
              <Input value={s.wallet_address} onChange={(e) => set("wallet_address", e.target.value)} placeholder="0x… — signing is applied" />
            </Field>
            <Field label="currencyCode">
              <Input value={s.currency_code} onChange={(e) => set("currency_code", e.target.value)} placeholder="eth" />
            </Field>
            <Field label="defaultCurrencyCode">
              <Input value={s.default_currency_code} onChange={(e) => set("default_currency_code", e.target.value)} placeholder="usdc" />
            </Field>
            <Field label="showOnlyCurrencies (csv)">
              <Input value={s.show_only_currencies} onChange={(e) => set("show_only_currencies", e.target.value)} placeholder="eth,usdc,btc" />
            </Field>
            <Field label="unsupportedRegionRedirectUrl">
              <Input
                value={s.unsupported_region_redirect_url}
                onChange={(e) => set("unsupported_region_redirect_url", e.target.value)}
                placeholder={`${window.location.origin}/moonpay/unsupported (default)`}
              />
              <p className="text-[10px] text-muted-foreground">
                Leave blank to use the built-in <span className="font-mono">/moonpay/unsupported</span> page.
              </p>
            </Field>
            <Field label="skipUnsupportedRegionScreen">
              <div className="flex items-center gap-2">
                <Switch
                  checked={s.skip_unsupported_region_screen}
                  onCheckedChange={(v) => set("skip_unsupported_region_screen", v)}
                />
                <span className="text-[10px] text-muted-foreground">
                  {s.skip_unsupported_region_screen
                    ? "Skip MoonPay's screen — redirect immediately"
                    : "Show MoonPay's default unsupported-region screen"}
                </span>
              </div>
            </Field>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={save} disabled={!loaded}>Save</Button>
              <Button size="sm" onClick={loadWidget} disabled={signing || !s.api_key}>
                {signing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                Load widget
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="card-gradient">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Widget</CardTitle>
              {widgetUrl && (
                <a href={widgetUrl} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Open in new tab <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </CardHeader>
            <CardContent>
              {widgetUrl ? (
                <iframe
                  ref={iframeRef}
                  title="MoonPay"
                  src={widgetUrl}
                  allow="accelerometer; autoplay; camera; gyroscope; payment"
                  className="w-full rounded-md border border-border"
                  style={{ height: 620 }}
                />
              ) : (
                <p className="text-xs text-muted-foreground py-16 text-center">
                  Configure and click <span className="font-mono">Load widget</span> to sign a URL and open the on-ramp.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient">
            <CardHeader>
              <CardTitle className="text-sm">Recent MoonPay events</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {events.length === 0 && (
                <p className="text-xs text-muted-foreground py-4">No events yet.</p>
              )}
              {events.map((ev) => (
                <div key={ev.id} className="py-2 text-xs font-mono flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                  <span className="text-foreground">{ev.event_type}</span>
                  {ev.status && <span className="text-muted-foreground">· {ev.status}</span>}
                  {ev.transaction_id && (
                    <span className="text-muted-foreground truncate">· tx {ev.transaction_id}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
