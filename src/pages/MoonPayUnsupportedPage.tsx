import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Landing route for MoonPay's `unsupportedRegionRedirectUrl`.
 * MoonPay redirects the whole top-level window here (or the iframe, when
 * `skipUnsupportedRegionScreen=true`) whenever the visitor's region is
 * blocked. We log the event and show a graceful fallback.
 */
export default function MoonPayUnsupportedPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    const raw = Object.fromEntries(params.entries());
    supabase.from("moonpay_events").insert({
      user_id: user.id,
      event_type: "unsupported_region_redirect",
      status: raw.status ?? "region_not_supported",
      raw,
    });
  }, [user, params]);

  const country = params.get("country") || params.get("region");

  return (
    <DashboardLayout title="Region not supported" subtitle="MoonPay cannot serve users in this location">
      <Card className="card-gradient max-w-xl">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-sm">On-ramp unavailable{country ? ` in ${country.toUpperCase()}` : ""}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            MoonPay's fiat-to-crypto on-ramp isn't available in this region. This event has been
            logged to your MoonPay events feed for auditing.
          </p>
          <p className="text-xs font-mono">
            {Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join(" · ") || "(no query parameters supplied)"}
          </p>
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/moonpay"><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to MoonPay</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/logs">View logs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
