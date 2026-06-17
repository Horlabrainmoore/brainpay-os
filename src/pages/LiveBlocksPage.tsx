import { DashboardLayout } from "@/components/DashboardLayout";
import { useLiveBlocks } from "@/hooks/useLiveBlocks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Box, Layers, Pickaxe, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

function feeRangeLabel(range?: number[]) {
  if (!range || range.length === 0) return "—";
  const min = Math.round(range[0]);
  const max = Math.round(range[range.length - 1]);
  return `${min} – ${max} sat/vB`;
}

export default function LiveBlocksPage() {
  const { blocks, status, error } = useLiveBlocks(20);
  const tip = blocks[0];

  return (
    <DashboardLayout title="Live Block Feed" subtitle="Bitcoin mainnet blocks (mempool.space)">
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Live Block Feed</h1>
            <p className="text-sm text-muted-foreground">
              Latest Bitcoin blocks from mempool.space — websocket-first with polling fallback.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 font-mono text-[10px]",
              status === "live" && "border-success text-success",
              status === "polling" && "border-warning text-warning",
              status === "error" && "border-destructive text-destructive",
            )}
          >
            {status === "live" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {status.toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3 w-3" /> Tip Height
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold text-foreground">
                {tip ? tip.height.toLocaleString() : <Skeleton className="h-7 w-32" />}
              </p>
              {tip && <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(tip.timestamp)}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="h-3 w-3" /> Tip Tx Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-mono font-bold text-foreground">
                {tip ? tip.tx_count.toLocaleString() : <Skeleton className="h-7 w-24" />}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Pickaxe className="h-3 w-3" /> Tip Miner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-foreground truncate">
                {tip?.extras?.pool?.name ?? (tip ? "Unknown" : <Skeleton className="h-6 w-28" />)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Box className="h-4 w-4" /> Recent Blocks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <p className="px-6 py-4 text-sm text-destructive">{error}</p>
            )}
            <div className="divide-y divide-border">
              {blocks.length === 0 && !error && (
                <div className="p-6 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )}
              {blocks.map((b) => (
                <div key={b.id} className="grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-secondary/30 transition-colors">
                  <div className="col-span-3 md:col-span-2">
                    <p className="text-sm font-mono font-bold text-primary">#{b.height.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{timeAgo(b.timestamp)}</p>
                  </div>
                  <div className="col-span-3 md:col-span-3 text-xs">
                    <p className="text-muted-foreground">Txs</p>
                    <p className="font-mono text-foreground">{b.tx_count.toLocaleString()}</p>
                  </div>
                  <div className="col-span-3 md:col-span-3 text-xs">
                    <p className="text-muted-foreground">Fee range</p>
                    <p className="font-mono text-foreground">{feeRangeLabel(b.extras?.feeRange)}</p>
                  </div>
                  <div className="col-span-3 md:col-span-4 text-xs text-right md:text-left">
                    <p className="text-muted-foreground">Miner</p>
                    <p className="font-medium text-foreground truncate">{b.extras?.pool?.name ?? "Unknown"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
