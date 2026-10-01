import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, PlugZap, Save } from "lucide-react";

interface TestResult {
  ok: boolean; status?: number; latencyMs: number; serverTime?: number; message: string; details?: string;
}

export default function ExchangeSettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [testedUrl, setTestedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("exchange_settings").select("base_url").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) { setSaved(data.base_url); setUrl(data.base_url); } });
  }, [user]);

  async function test() {
    setTesting(true); setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("exchange-proxy", { body: { testBaseUrl: url } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.data); setTestedUrl(url.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally { setTesting(false); }
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const base_url = url.trim().replace(/\/$/, "");
    const { error } = await supabase.from("exchange_settings").upsert({
      user_id: user.id, base_url, last_test_ok: result?.ok ?? null,
      last_test_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setSaved(base_url); toast.success("Exchange address saved");
  }

  async function reset() {
    if (!user) return;
    await supabase.from("exchange_settings").delete().eq("user_id", user.id);
    setSaved(null); setUrl(""); setResult(null);
    toast.success("Using the default address again");
  }

  const canSave = !!result?.ok && testedUrl === url.trim();

  return (
    <DashboardLayout title="Exchange settings" subtitle="Choose which API address the Exchange page talks to">
      <div className="max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/exchange"><ArrowLeft className="h-4 w-4 mr-1" />Back to Exchange</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>API base URL</CardTitle>
            <CardDescription>
              Currently using: {saved ? <span className="font-mono">{saved}</span> : "the default address saved in your backend"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="base">Address</Label>
              <Input id="base" placeholder="https://api.example.com" value={url}
                onChange={(e) => { setUrl(e.target.value); setResult(null); }} />
              <p className="text-xs text-muted-foreground">Must be https and serve <span className="font-mono">/openapi/v1/time</span>.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={test} disabled={!url.trim() || testing} variant="outline">
                {testing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PlugZap className="h-4 w-4 mr-1" />}Test connection
              </Button>
              <Button onClick={save} disabled={!canSave || saving}>
                <Save className="h-4 w-4 mr-1" />Save
              </Button>
              {saved && <Button variant="ghost" onClick={reset}>Use default</Button>}
            </div>
            {!canSave && url.trim() && <p className="text-xs text-muted-foreground">Run a successful test before saving.</p>}
            {result && (
              <div className="rounded-md border border-border p-3 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={result.ok ? "default" : "destructive"}>{result.ok ? "Connected" : "Failed"}</Badge>
                  <span>{result.message}</span>
                </div>
                <div className="text-muted-foreground">
                  {result.status !== undefined && <>HTTP {result.status} · </>}{result.latencyMs} ms
                  {result.serverTime && <> · server time {new Date(result.serverTime).toLocaleString()}</>}
                </div>
                {result.details && <p className="text-xs text-muted-foreground break-all">{result.details}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
