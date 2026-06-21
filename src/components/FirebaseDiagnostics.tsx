import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { activateRemoteConfig, getFlagString, remoteConfigReady } from "@/lib/remoteConfig";
import { analyticsReady, trackEvent } from "@/lib/analytics";
import { isFirebaseConfigured } from "@/lib/firebase";

const SAMPLE_KEY = "welcome_message";

export function FirebaseDiagnostics() {
  const [value, setValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    const ok = await activateRemoteConfig();
    setValue(getFlagString(SAMPLE_KEY, "(default) Welcome to BrainPay"));
    setLoading(false);
    if (!remoteConfigReady()) toast.error("Remote Config not initialized — check Firebase env vars");
    else if (ok) toast.success(`Fetched "${SAMPLE_KEY}"`);
    else toast.message("Using cached/default value");
  };

  useEffect(() => { void fetchConfig(); }, []);

  const sendTestEvent = () => {
    const name = "diagnostic_ping";
    const params = { source: "settings_diagnostics", ts: Date.now() };
    const ok = trackEvent(name, params);
    if (ok) {
      setLastEvent(`${name} @ ${new Date().toLocaleTimeString()}`);
      toast.success("Analytics event sent — check Firebase DebugView");
    } else {
      toast.error(analyticsReady() ? "logEvent failed" : "Analytics not initialized");
    }
  };

  return (
    <div className="card-gradient rounded-lg border border-border p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Firebase diagnostics</h3>
          <p className="text-xs text-muted-foreground">Remote Config + Analytics sanity check</p>
        </div>
      </div>

      {!isFirebaseConfigured && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          Firebase env vars are missing. See <code>FIREBASE_SETUP.md</code> in the project root.
        </div>
      )}

      <div className="rounded-md bg-secondary/40 border border-border p-3 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Remote Config · <code className="font-mono">{SAMPLE_KEY}</code>
        </p>
        <p className="text-sm font-mono text-foreground break-all">{value || "—"}</p>
        <Button size="sm" variant="outline" onClick={fetchConfig} disabled={loading} className="gap-2 mt-2">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Fetching…" : "Re-fetch"}
        </Button>
      </div>

      <div className="rounded-md bg-secondary/40 border border-border p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Analytics test event</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={sendTestEvent} className="gap-2">
            <Send className="h-3.5 w-3.5" /> Send <code className="font-mono">diagnostic_ping</code>
          </Button>
          {lastEvent && <span className="text-[11px] text-muted-foreground">Sent: {lastEvent}</span>}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Verify in Firebase Console → Analytics → DebugView (enable debug mode in your browser via the
          GA Debugger extension or <code>?firebase_debug=1</code>).
        </p>
      </div>
    </div>
  );
}
