import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  metacopier,
  type MetaCopierAccount,
  type MetaCopierPosition,
  type MetaCopierPerformance,
} from "@/lib/metacopier";

function fmtNum(n: unknown, digits = 2): string {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtDate(s?: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
}

function accountLabel(a: MetaCopierAccount): string {
  const name = a.name ?? a.login ?? a.id;
  const broker = a.broker ?? a.brokerType ?? a.platform;
  return broker ? `${name} · ${broker}` : String(name);
}

function PositionsTable({ rows, emptyText }: { rows: MetaCopierPosition[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">{emptyText}</p>;
  }
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Side</TableHead>
            <TableHead className="text-right">Lots</TableHead>
            <TableHead className="text-right">Open</TableHead>
            <TableHead className="text-right">Close / Now</TableHead>
            <TableHead className="text-right">P/L</TableHead>
            <TableHead>Opened</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => {
            const side = (p.side ?? p.type ?? "").toString().toLowerCase();
            const pnl = typeof p.profit === "number" ? p.profit : Number(p.profit);
            return (
              <TableRow key={String(p.id ?? p.ticket ?? i)}>
                <TableCell className="font-mono text-xs">{p.ticket ?? p.id ?? "—"}</TableCell>
                <TableCell className="font-medium">{p.symbol ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={side === "buy" ? "default" : side === "sell" ? "destructive" : "secondary"}>
                    {side || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{fmtNum(p.lots ?? p.volume, 2)}</TableCell>
                <TableCell className="text-right font-mono">{fmtNum(p.openPrice, 3)}</TableCell>
                <TableCell className="text-right font-mono">
                  {fmtNum(p.closePrice ?? p.currentPrice, 3)}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    Number.isFinite(pnl) ? (pnl >= 0 ? "text-primary" : "text-destructive") : ""
                  }`}
                >
                  {fmtNum(pnl, 2)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtDate(p.openTime)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PerformanceGrid({ perf }: { perf: MetaCopierPerformance }) {
  const items: Array<[string, string]> = [
    ["Total trades", fmtNum(perf.totalTrades, 0)],
    ["Win rate", perf.winRate != null ? `${fmtNum(perf.winRate, 2)}%` : "—"],
    ["Profit factor", fmtNum(perf.profitFactor, 2)],
    ["Total profit", fmtNum(perf.totalProfit, 2)],
    ["Total loss", fmtNum(perf.totalLoss, 2)],
    ["Max drawdown", fmtNum(perf.maxDrawdown, 2)],
    ["Avg win", fmtNum(perf.averageWin, 2)],
    ["Avg loss", fmtNum(perf.averageLoss, 2)],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border p-3">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold text-foreground mt-1 font-mono">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function MetaCopierPage() {
  const [accountId, setAccountId] = useState<string | undefined>();

  const accountsQ = useQuery({
    queryKey: ["mc-accounts"],
    queryFn: () => metacopier.listAccounts(),
    retry: false,
  });

  useEffect(() => {
    if (!accountId && accountsQ.data && accountsQ.data.length > 0) {
      setAccountId(String(accountsQ.data[0].id));
    }
  }, [accountId, accountsQ.data]);

  const positionsQ = useQuery({
    queryKey: ["mc-positions", accountId],
    queryFn: () => metacopier.getPositions(accountId!),
    enabled: !!accountId,
    refetchInterval: 15000,
  });

  const historyQ = useQuery({
    queryKey: ["mc-history", accountId],
    queryFn: () => metacopier.getHistoryPositions(accountId!, { size: 100 }),
    enabled: !!accountId,
  });

  const perfQ = useQuery({
    queryKey: ["mc-perf", accountId],
    queryFn: () => metacopier.getPerformanceMetrics(accountId!),
    enabled: !!accountId,
  });

  const selectedAccount = useMemo(
    () => accountsQ.data?.find((a) => String(a.id) === accountId),
    [accountsQ.data, accountId],
  );

  const refreshAll = () => {
    positionsQ.refetch();
    historyQ.refetch();
    perfQ.refetch();
    toast.success("Refreshing MetaCopier data");
  };

  const apiError = accountsQ.error as Error | undefined;

  return (
    <DashboardLayout title="MetaCopier" subtitle="Live copy-trading accounts via MetaCopier API">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Account</CardTitle>
              <p className="text-xs text-muted-foreground">
                Data is proxied through the <code className="font-mono">metacopier-proxy</code> edge function — your API key never leaves the server.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={accountId} onValueChange={setAccountId} disabled={accountsQ.isLoading || !accountsQ.data?.length}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder={accountsQ.isLoading ? "Loading…" : "Select account"} />
                </SelectTrigger>
                <SelectContent>
                  {accountsQ.data?.map((a) => (
                    <SelectItem key={String(a.id)} value={String(a.id)}>
                      {accountLabel(a)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={refreshAll} disabled={!accountId}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {apiError && (
            <CardContent>
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">Could not reach MetaCopier</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono break-all">{apiError.message}</div>
                </div>
              </div>
            </CardContent>
          )}
          {selectedAccount && (
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Login</div><div className="font-mono">{String(selectedAccount.login ?? selectedAccount.id)}</div></div>
                <div><div className="text-xs text-muted-foreground">Broker</div><div>{selectedAccount.broker ?? selectedAccount.brokerType ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">Platform</div><div>{selectedAccount.platform ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">Type</div><div>{selectedAccount.type ?? "—"}</div></div>
                <div><div className="text-xs text-muted-foreground">Status</div><div>{selectedAccount.status ?? "—"}</div></div>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="positions" className="space-y-3">
          <TabsList>
            <TabsTrigger value="positions">Open positions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <Card>
              <CardHeader><CardTitle className="text-base">Open positions</CardTitle></CardHeader>
              <CardContent>
                {positionsQ.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : positionsQ.error ? (
                  <p className="text-sm text-destructive">{(positionsQ.error as Error).message}</p>
                ) : (
                  <PositionsTable rows={positionsQ.data ?? []} emptyText="No open positions." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle className="text-base">Closed positions (last 100)</CardTitle></CardHeader>
              <CardContent>
                {historyQ.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : historyQ.error ? (
                  <p className="text-sm text-destructive">{(historyQ.error as Error).message}</p>
                ) : (
                  <PositionsTable rows={historyQ.data ?? []} emptyText="No closed positions." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader><CardTitle className="text-base">Performance metrics</CardTitle></CardHeader>
              <CardContent>
                {perfQ.isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : perfQ.error ? (
                  <p className="text-sm text-destructive">{(perfQ.error as Error).message}</p>
                ) : (
                  <PerformanceGrid perf={perfQ.data ?? {}} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
