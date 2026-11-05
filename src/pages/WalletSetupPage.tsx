import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { validateProjectId } from "@/lib/walletconnect";
import { TrustConnectProvider, useConnection } from "@trustwallet/connect-react";
import { createBIP122 } from "@trustwallet/connect-bip122-react";
import { createWalletConnect, useWalletConnect } from "@trustwallet/connect-walletconnect/react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import {
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  RefreshCw,
  Smartphone,
  XCircle,
} from "lucide-react";

const TRUST_WALLET_LINK = "https://link.trustwallet.com/wc?uri=";

function PairingCard({ configured }: { configured: boolean }) {
  const { uri, generateUri, isUriLoading, error } = useWalletConnect();
  const { isConnected, address, wallet } = useConnection({ namespaceId: "bip122" as never });
  const [pairing, setPairing] = useState(false);

  const startPairing = async () => {
    setPairing(true);
    try {
      await generateUri();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start pairing");
    } finally {
      setPairing(false);
    }
  };

  const status = isConnected ? "connected" : uri ? "waiting" : "idle";

  return (
    <div className="card-gradient rounded-lg border border-border p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pairing status</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Scan or open the link with your mobile Bitcoin wallet to approve the connection.
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            status === "connected"
              ? "text-success border-success/40"
              : status === "waiting"
                ? "text-warning border-warning/40"
                : "text-muted-foreground"
          }
        >
          {status === "connected" ? "Connected" : status === "waiting" ? "Waiting for approval" : "Not paired"}
        </Badge>
      </div>

      {isConnected ? (
        <div className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border">
          <p className="text-sm font-medium text-foreground">{wallet?.name ?? "Mobile wallet"}</p>
          <code className="text-[11px] text-muted-foreground font-mono break-all">{address}</code>
        </div>
      ) : configured ? (
        <div className="space-y-3">
          {uri ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-lg">
                <QRCode value={uri} size={180} />
              </div>
              <code className="text-[10px] text-muted-foreground font-mono break-all text-center max-w-md">{uri}</code>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(uri); toast.success("Pairing link copied"); }}>
                  <Copy className="h-3.5 w-3.5" /> Copy link
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={`${TRUST_WALLET_LINK}${encodeURIComponent(uri)}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Trust Wallet
                  </a>
                </Button>
                <Button size="sm" variant="ghost" onClick={startPairing} disabled={isUriLoading}>
                  <RefreshCw className="h-3.5 w-3.5" /> New code
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={startPairing} disabled={pairing || isUriLoading} className="gap-2">
              <Smartphone className="h-4 w-4" />
              {pairing || isUriLoading ? "Generating…" : "Connect mobile wallet"}
            </Button>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Save a valid project ID above to enable pairing.</p>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-start gap-1.5">
          <CircleAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {error.message}
        </p>
      )}
    </div>
  );
}

export default function WalletSetupPage() {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("walletconnect_settings")
        .select("project_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.project_id) {
        setProjectId(data.project_id);
        setSavedId(data.project_id);
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const parsed = validateProjectId(projectId);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("walletconnect_settings").upsert({
      user_id: user.id,
      project_id: parsed.error === undefined ? projectId.trim() : projectId,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      setSavedId(projectId.trim());
      toast.success("Project ID saved");
    }
  };

  const bip122 = useMemo(() => createBIP122({ chain: "bip122:000000000019d6689c085ae165831e934c767ae9" }), []);
  const services = useMemo(
    () =>
      savedId
        ? [
            createWalletConnect({
              projectId: savedId,
              metadata: {
                name: "BrainPay OS",
                url: window.location.origin,
                description: "BrainPay Bitcoin payments workspace",
                icons: [`${window.location.origin}/favicon.ico`],
              },
            }),
          ]
        : [],
    [savedId],
  );

  const checks = [
    { label: "Project ID entered", done: projectId.trim().length > 0 },
    { label: "Format valid (32-character ID)", done: validateProjectId(projectId).ok },
    { label: "Saved to your account", done: Boolean(savedId) },
  ];
  const configured = Boolean(savedId && validateProjectId(savedId).ok);

  return (
    <DashboardLayout title="Mobile Wallet Setup" subtitle="WalletConnect configuration, readiness, and pairing">
      <div className="space-y-6 max-w-2xl">
        <div className="card-gradient rounded-lg border border-border p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Required configuration</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Mobile pairing needs a WalletConnect project ID. Create one at{" "}
              <a href="https://cloud.walletconnect.com" target="_blank" rel="noreferrer" className="text-primary underline">
                cloud.walletconnect.com
              </a>
              , and enable the Bitcoin (BIP-122) namespace.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">WalletConnect project ID</Label>
            <Input
              placeholder="e.g. 3f26f51234567890abcdef1234567890"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-md bg-secondary/30 border border-border">
            <p className="font-medium text-foreground">Connection metadata used when pairing</p>
            <p>App: BrainPay OS</p>
            <p className="font-mono break-all">Origin: {typeof window !== "undefined" ? window.location.origin : ""}</p>
          </div>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Saving…" : savedId === projectId.trim() ? "Saved" : "Save project ID"}
          </Button>
        </div>

        <div className="card-gradient rounded-lg border border-border p-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Connection readiness</h3>
          <div className="space-y-2">
            {checks.map((c) => (
              <div key={c.label} className="flex items-center gap-2 text-xs">
                {c.done ? (
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={c.done ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        <TrustConnectProvider key={savedId ?? "unconfigured"} config={{ namespaces: [bip122], services }}>
          <PairingCard configured={configured} />
        </TrustConnectProvider>

        <div className="card-gradient rounded-lg border border-border p-6 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recovery steps</h3>
          <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
            <li>Pairing link expired? Click “New code” — links are single-use and expire after a few minutes.</li>
            <li>Wallet never prompted? Confirm the project ID is valid and the Bitcoin namespace is enabled in your WalletConnect project.</li>
            <li>Approval rejected in the wallet? Generate a new code and approve the requested Bitcoin address and permissions.</li>
            <li>Still failing? Check your internet connection and browser extensions, then reload this page and retry.</li>
            <li>Connection succeeded but no address? Disconnect in the wallet app, then pair again from this page.</li>
          </ol>
        </div>
      </div>
    </DashboardLayout>
  );
}
