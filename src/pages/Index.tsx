import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { SignalCard } from "@/components/SignalCard";
import { wallets, recentTransactions, tradeSignals, balanceHistory, tradingHistory, aiInsights, Transaction } from "@/lib/mock-data";
import { Wallet, TrendingUp, CreditCard, Brain, ArrowUpRight, Shield } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";
import { usePrices } from "@/hooks/usePrices";
import { useTransactions } from "@/hooks/useTransactions";
import { MempoolFeeCharts } from "@/components/MempoolFeeCharts";
import { useMemo } from "react";

export default function Dashboard() {
  const { prices, connected } = usePrices(["BTC", "ETH", "SOL"]);
  const { transactions } = useTransactions();

  const totalBalance = useMemo(
    () => wallets.reduce((sum, w) => sum + w.balance * (prices[w.symbol]?.price ?? (w.usdValue / w.balance || 1)), 0),
    [prices]
  );

  const dbTxView: Transaction[] = transactions.slice(0, 5).map((t) => ({
    id: t.id,
    type: (["send", "receive", "trade", "payment"].includes(t.type) ? t.type : "payment") as Transaction["type"],
    amount: Number(t.amount),
    currency: t.asset,
    description: t.description ?? "",
    timestamp: t.created_at,
    status: (["completed", "pending", "failed"].includes(t.status) ? t.status : "completed") as Transaction["status"],
    route: (t.metadata?.route as Transaction["route"]) ?? undefined,
    txid: (t.metadata?.txid as string) ?? undefined,
  }));
  const txToShow = dbTxView.length > 0 ? dbTxView : recentTransactions.slice(0, 5);
  return (
    <DashboardLayout title="Dashboard" subtitle="Overview of your financial operations">
      <div className="space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Balance" value={`$${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change={connected ? "Live" : "Connecting…"} changeType={connected ? "positive" : "neutral"} icon={Wallet} subtitle="real-time" />
          <MetricCard title="Trading P&L" value="+$9,600" change="+12.4%" changeType="positive" icon={TrendingUp} subtitle="this month" />
          <MetricCard title="Payments Processed" value="$1,538" change="5 transactions" changeType="neutral" icon={CreditCard} subtitle="this week" />
          <MetricCard title="AI Confidence" value="87%" change="3 active signals" changeType="positive" icon={Brain} subtitle="avg" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card-gradient rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Portfolio Value</h3>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <span className="text-xs font-mono text-success">+10.4%</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={balanceHistory}>
                <defs>
                  <linearGradient id="balGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 95%)' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Value']} />
                <Area type="monotone" dataKey="value" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#balGradient)" />
              </AreaChart>
            </ResponsiveContainer>
        </div>

        {/* Mempool fee & fee-range charts */}
        <MempoolFeeCharts />


          <div className="card-gradient rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Trading P&L</h3>
                <p className="text-xs text-muted-foreground">Daily returns</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tradingHistory}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 95%)' }} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fill="hsl(160, 84%, 39%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Signals + Transactions + AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Active Signals</h3>
            <div className="space-y-3">
              {tradeSignals.slice(0, 3).map(s => (
                <SignalCard key={s.id} signal={s} />
              ))}
            </div>
          </div>

          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
            <TransactionList transactions={txToShow} compact />
          </div>

          <div className="card-gradient rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">AI Decisions</h3>
            <div className="space-y-3">
              {aiInsights.slice(0, 4).map(insight => {
                const typeIcons = { trade: TrendingUp, route: ArrowUpRight, risk: Shield, alert: Brain };
                const Icon = typeIcons[insight.type];
                return (
                  <div key={insight.id} className="p-3 rounded-lg bg-secondary/50 space-y-1.5 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">{insight.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-primary">{insight.confidence}% confidence</span>
                      {insight.action && (
                        <button className="text-[10px] font-medium text-primary hover:underline">{insight.action}</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
