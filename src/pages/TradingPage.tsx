import { DashboardLayout } from "@/components/DashboardLayout";
import { SignalCard } from "@/components/SignalCard";
import { tradeSignals, tradingHistory } from "@/lib/mock-data";
import { MetricCard } from "@/components/MetricCard";
import { TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useTrades } from "@/hooks/useTrades";
import { useTransactions } from "@/hooks/useTransactions";
import { usePrices } from "@/hooks/usePrices";

export default function TradingPage() {
  const [selectedPair, setSelectedPair] = useState("BTC/USDC");
  const { addTrade, trades } = useTrades();
  const { addTransaction } = useTransactions();
  const { prices } = usePrices(["BTC", "ETH", "SOL"]);

  const baseSymbol = selectedPair.split("/")[0];
  const livePrice = prices[baseSymbol]?.price ?? null;

  const handleTrade = async (type: 'buy' | 'sell') => {
    const price = livePrice ?? 65120.5;
    const amount = 0.01;
    const { error } = await addTrade({
      symbol: selectedPair,
      side: type,
      amount,
      entry_price: price,
      confidence: 80,
      signal_id: null,
    });
    if (error) {
      toast.error(error);
      return;
    }
    await addTransaction({
      type: 'trade',
      asset: baseSymbol,
      amount,
      usd_value: amount * price,
      status: 'completed',
      description: `${type.toUpperCase()} ${amount} ${baseSymbol} @ $${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      metadata: { side: type, pair: selectedPair },
    });
    toast.success(`${type.toUpperCase()} order placed for ${selectedPair}`, {
      description: `Filled @ $${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    });
  };

  return (
    <DashboardLayout title="Trading" subtitle="AI-powered trading engine">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Win Rate" value="73.2%" change="+2.1%" changeType="positive" icon={Target} subtitle="30d" />
          <MetricCard title="Total Trades" value={String(trades.length || 142)} change={`${trades.length} executed`} changeType="neutral" icon={BarChart3} />
          <MetricCard title="Avg Return" value="+4.8%" change="per trade" changeType="positive" icon={TrendingUp} />
          <MetricCard title="AI Signals" value="5 active" change="3 high confidence" changeType="positive" icon={Zap} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="card-gradient rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Cumulative P&L</h3>
                <div className="flex gap-1">
                  {["BTC/USDC", "ETH/USDC", "SOL/USDC"].map(pair => (
                    <button key={pair} onClick={() => setSelectedPair(pair)}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-mono transition-colors ${
                        selectedPair === pair ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}>
                      {pair}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={tradingHistory}>
                  <defs>
                    <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 12%, 50%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 18%, 12%)', border: '1px solid hsl(220, 14%, 18%)', borderRadius: '8px', fontSize: '12px', color: 'hsl(210, 20%, 95%)' }} />
                  <Area type="monotone" dataKey="pnl" stroke="hsl(160, 84%, 39%)" strokeWidth={2} fill="url(#pnlGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card-gradient rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Quick Trade</h3>
              <p className="text-xs text-muted-foreground mb-4">Execute simulated trades based on AI signals</p>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-semibold text-foreground">{selectedPair}</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {livePrice ? `$${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "Loading…"}
                </span>
                <div className="flex-1" />
                <Button size="sm" onClick={() => handleTrade('buy')} className="bg-success/20 text-success border border-success/30 hover:bg-success/30">BUY</Button>
                <Button size="sm" onClick={() => handleTrade('sell')} variant="destructive" className="bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive/30">SELL</Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">AI Trade Signals</h3>
            {tradeSignals.map(s => <SignalCard key={s.id} signal={s} />)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
