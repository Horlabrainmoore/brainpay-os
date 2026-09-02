import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

// Local wrapper for the beta supabase.auth.oauth namespace.
interface OAuthApi {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
}
const oauth = (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authorizationId) {
      setError("Missing authorization_id");
      return;
    }
    if (!user) {
      const next = window.location.pathname + window.location.search;
      navigate(`/auth?next=${encodeURIComponent(next)}`, { replace: true });
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message ?? String(error));
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { active = false; };
  }, [authLoading, user, authorizationId, navigate]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await oauth.approveAuthorization(authorizationId)
        : await oauth.denyAuthorization(authorizationId);
      // Record the decision so the Agent integrations page can list clients.
      try {
        await supabase.from("oauth_client_consents").insert({
          user_id: user?.id,
          client_id: details?.client?.id ?? details?.client?.client_id ?? null,
          client_name: details?.client?.name ?? details?.client?.client_name ?? null,
          scopes: Array.isArray(details?.scopes) ? details.scopes.join(" ") : (details?.scopes ?? null),
          redirect_uri: details?.client?.redirect_uri ?? null,
          approved: approve,
        });
      } catch (e) {
        console.warn("consent record failed", e);
      }
      if (error) {
        setBusy(false);
        setError(error.message ?? String(error));
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("No redirect returned by the authorization server.");
        return;
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (authLoading || (!user && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground text-sm font-mono">
          <Zap className="h-4 w-4 text-primary animate-pulse" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md card-gradient rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Connect {details?.client?.name ?? details?.client?.client_name ?? "an app"} to BrainPay OS
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              Signed in as {user?.email}
            </p>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">Could not load this authorization request: {error}</p>
        ) : !details ? (
          <p className="text-sm text-muted-foreground">Loading authorization request…</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              This lets {details?.client?.name ?? "the client"} call BrainPay OS tools while you are signed in.
              It does not bypass this app's permissions — RLS still scopes every read to your account.
            </p>
            {details?.client?.redirect_uri && (
              <p className="text-[11px] font-mono text-muted-foreground break-all">
                Redirect: {details.client.redirect_uri}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                {busy ? "Working…" : "Approve"}
              </Button>
              <Button className="flex-1" variant="outline" disabled={busy} onClick={() => decide(false)}>
                Cancel connection
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
