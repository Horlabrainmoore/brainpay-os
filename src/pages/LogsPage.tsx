import { DashboardLayout } from "@/components/DashboardLayout";
import { systemLogs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { CheckCircle, Info, AlertTriangle, XCircle, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const levelConfig = {
  success: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
};

interface ProxyLog {
  id: string;
  correlation_id: string;
  path: string;
  method: string;
  status: number | null;
  ok: boolean;
  duration_ms: number | null;
  error: string | null;
  created_at: string;
}

function ProxyLogs() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["metacopier-proxy-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("metacopier_proxy_logs")
        .select("id, correlation_id, path, method, status, ok, duration_ms, error, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ProxyLog[];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Most recent 200 MetaCopier proxy requests. Auto-refreshes every 10s.
        </p>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="card-gradient rounded-lg border border-border divide-y divide-border">
        {isLoading && <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>}
        {error && (
          <div className="p-8 text-center text-sm text-destructive">
            {(error as Error).message}
          </div>
        )}
        {!isLoading && !error && data?.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No proxy requests recorded yet. Open the MetaCopier page to generate traffic.
          </div>
        )}
        {data?.map((log) => {
          const isErr = !log.ok;
          const Icon = isErr ? XCircle : CheckCircle;
          const color = isErr ? "text-destructive" : "text-success";
          const bg = isErr ? "bg-destructive/10" : "bg-success/10";
          return (
            <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors">
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border font-mono">
                    {log.method}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] px-1.5 py-0 h-4 font-mono",
                      isErr ? "border-destructive/40 text-destructive" : "border-success/40 text-success",
                    )}
                  >
                    {log.status ?? "—"}
                  </Badge>
                  <p className="text-sm text-foreground font-mono truncate">{log.path}</p>
                  {log.duration_ms != null && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {log.duration_ms}ms
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(log.correlation_id);
                    }}
                    title="Copy correlation ID"
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 px-1.5 py-0.5 rounded border border-border"
                  >
                    cid: {log.correlation_id.slice(0, 8)}…{log.correlation_id.slice(-4)}
                  </button>
                </div>
                {log.error && (
                  <p className="text-[11px] text-destructive font-mono break-all">{log.error}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap">
                {new Date(log.created_at).toLocaleString([], {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SystemLogs() {
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const filtered = systemLogs.filter(log => {
    const matchesText = !filter || log.message.toLowerCase().includes(filter.toLowerCase()) || log.category.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = !levelFilter || log.level === levelFilter;
    return matchesText && matchesLevel;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={filter} onChange={e => setFilter(e.target.value)}
            className="pl-9 bg-secondary border-border font-mono text-sm" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setLevelFilter(null)}
            className={cn("text-[10px] px-3 py-1.5 rounded-md font-medium transition-colors",
              !levelFilter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            )}>All</button>
          {Object.keys(levelConfig).map(level => (
            <button key={level} onClick={() => setLevelFilter(levelFilter === level ? null : level)}
              className={cn("text-[10px] px-3 py-1.5 rounded-md font-medium capitalize transition-colors",
                levelFilter === level ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              )}>{level}</button>
          ))}
        </div>
      </div>

      <div className="card-gradient rounded-lg border border-border divide-y divide-border">
        {filtered.map(log => {
          const config = levelConfig[log.level];
          const Icon = config.icon;
          return (
            <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-secondary/30 transition-colors">
              <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                <Icon className={cn("h-3.5 w-3.5", config.color)} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border font-mono">{log.category}</Badge>
                  <p className="text-sm text-foreground">{log.message}</p>
                </div>
                {log.details && <p className="text-[11px] text-muted-foreground font-mono">{log.details}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No logs match your filters</div>
        )}
      </div>
    </div>
  );
}

export default function LogsPage() {
  return (
    <DashboardLayout title="System Logs" subtitle="Monitor system events, transactions, and integration diagnostics">
      <Tabs defaultValue="system" className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="metacopier">MetaCopier proxy</TabsTrigger>
        </TabsList>
        <TabsContent value="system"><SystemLogs /></TabsContent>
        <TabsContent value="metacopier"><ProxyLogs /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
