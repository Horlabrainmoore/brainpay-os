import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { MempoolFeeCharts } from "@/components/MempoolFeeCharts";
import { wallets, recentTransactions, balanceHistory, Transaction } from "@/lib/mock-data";
import { ArrowUpRight, Copy, Database, RefreshCw, Shield, Wallet, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { usePrices } from "@/hooks/usePrices";
import { useTransactions } from "@/hooks/useTransactions";
import { useMempoolBtc } from "@/hooks/useMempoolBtc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const DEFAULT_ADDRESS = "14m9q9X5rxVdHSdhecLNxTyExruE3zoaac";
const SQL_QUERY = `SELECT\n  sum(value_btc) AS balance_btc,\n  count(*) AS utxos\nFROM outputs\nWHERE address = '14m9q9X5rxVdHSdhecLNxTyExruE3zoaac'\n  AND spent = false;`;

export default function Dashboard() {
  const { prices, connected } = usePrices(["BTC", "ETH", "SOL"]);
  const { transactions } = useTransactions();
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [lookupAddress, setLookupAddress] = useState(DEFAULT_ADDRESS);
  const { stats, feeEstimate, error } = useMempoolBtc(address);

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance * (prices[w.symbol]?.price ?? (w.usdValue / w.balance || 1)), 0),
    [prices]
  );

  const dbTxView: Transaction[] = transactions.slice(0, 5).map((t) => ({
    id: t.id,
    type: (["send", "receive", "trade", "payment"].includes(t.type) ? t.type : "payment") as Transaction["type"],
    amount: Number(t.amount), currency: t.asset, description: t.description ?? "", timestamp: t.created_at,
    status: (["completed", "pending", "failed"].includes(t.status) ? t.status : "completed") as Transaction["status"],
    route: (t.metadata?.route as Transaction["route"]) ?? undefined,
    txid: (t.metadata?.txid as string) ?? undefined,
  }));

  const submitLookup = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^(1|3|bc1)/i.test(lookupAddress.trim())) {
      toast.error("Enter a valid Bitcoin address");
      return;
    }
    setAddress(lookupAddress.trim());
    toast.success("Address data refreshed");
  };

  const copySql = async () => {
    await navigator.clipboard.writeText(SQL_QUERY);
    toast.success("SQL copied to clipboard");
  };

  return (
    <DashboardLayout title="Dashboard" subtitle="Bitcoin wallet intelligence and operational controls">
      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wallet /></div>
              <div><p className="text-sm font-semibold">Tracked Bitcoin address</p><p className="mt-1 max-w-xl text-xs text-muted-foreground">Use the same address in the dashboard query, UTXO explorer, and transaction tools.</p></div>
            </div>
            <form onSubmit={submitLookup} className="flex w-full gap-2 lg:max-w-xl">
              <Input aria-label="Bitcoin address" value={lookupAddress} onChange={(e) => setLookupAddress(e.target.value)} className="font-mono text-xs" spellCheck={false} />
              <Button type="submit"><RefreshCw data-icon="inline-start" /> Refresh</Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="BTC balance" value={stats ? `${stats.balanceBtc.toFixed(8)} BTC` : "Loading…"} change={stats ? `${stats.balanceSats.toLocaleString()} sats` : "On-chain"} changeType="positive" icon={Wallet} subtitle="unspent outputs" />
          <MetricCard title="Open UTXOs" value={stats ? stats.txCount.toLocaleString() : "—"} change="address activity" changeType="neutral" icon={Database} subtitle="indexed transactions" />
          <MetricCard title="Mid-priority fee" value={feeEstimate ? `${feeEstimate} sat/vB` : "—"} change="mempool.space" changeType="neutral" icon={Zap} subtitle="confirmation estimate" />
          <MetricCard title="Portfolio value" value={`$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change={connected ? "Live" : "Syncing"} changeType={connected ? "positive" : "neutral"} icon={Shield} subtitle="tracked assets" />
        </div>

        {error && <p className="text-xs text-destructive">Live lookup unavailable: {error}</p>}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2"><CardHeader><CardTitle className="text-sm">Balance history</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={240}><AreaChart data={balanceHistory}><defs><linearGradient id="balGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} /><Tooltip /><Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#balGradient)" strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card>
          <MempoolFeeCharts />
        </div>

        <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle className="text-sm">SQL balance query</CardTitle><p className="mt-1 text-xs text-muted-foreground">Expected result: one row for unspent outputs at the tracked address.</p></div><Button variant="outline" size="sm" onClick={copySql}><Copy data-icon="inline-start" /> Copy SQL</Button></CardHeader><CardContent><pre className="overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs leading-6 text-foreground"><code>{SQL_QUERY}</code></pre><div className="mt-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">balance_btc: {stats ? stats.balanceBtc.toFixed(8) : "—"}</Badge><Badge variant="outline">utxos: {stats ? stats.txCount : "—"}</Badge><span className="text-xs text-muted-foreground">address: {address}</span></div></CardContent></Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-sm">Recent transactions</CardTitle><Button variant="ghost" size="sm" onClick={() => window.location.assign("/address-lookup")}><ArrowUpRight data-icon="inline-end" /> View all</Button></CardHeader><CardContent><TransactionList transactions={dbTxView.length ? dbTxView : recentTransactions.slice(0, 5)} compact /></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Quick actions</CardTitle></CardHeader><CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button variant="outline" onClick={() => window.location.assign(`/wallets/utxos?address=${encodeURIComponent(address)}`)}>Inspect UTXOs</Button><Button variant="outline" onClick={() => window.location.assign("/blocks")}>Live blocks</Button><Button variant="outline" onClick={() => window.location.assign("/trading")}>Trading terminal</Button><Button variant="outline" onClick={() => window.location.assign("/settings")}>Workspace settings</Button></CardContent></Card></div>
      </div>
    </DashboardLayout>
  );
}
