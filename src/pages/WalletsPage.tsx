import { DashboardLayout } from "@/components/DashboardLayout";
import { wallets as mockWallets } from "@/lib/mock-data";
import { Copy, Plus, Activity, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePrices } from "@/hooks/usePrices";
import { useMempoolBtc } from "@/hooks/useMempoolBtc";
import { useTransactions } from "@/hooks/useTransactions";
import { useMemo } from "react";
import { TransactionList } from "@/components/TransactionList";
import { Transaction } from "@/lib/mock-data";

export default function WalletsPage() {
  const { prices, connected } = usePrices(["BTC", "ETH", "SOL"]);
  const { stats, feeEstimate } = useMempoolBtc();
  const { transactions } = useTransactions();

  // Apply live prices to wallet USD values
  const liveWallets = useMemo(() => {
    return mockWallets.map((w) => {
      const p = prices[w.symbol];
      if (!p) return w;
      return {
        ...w,
        usdValue: w.balance * p.price,
        change24h: p.change24h,
      };
    });
  }, [prices]);

  const dbTxView: Transaction[] = transactions.length === 0 ? [] : transactions.map((t) => ({
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

  return (
    <DashboardLayout title="Wallets" subtitle="Manage your crypto and fiat wallets">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Your Wallets</h3>
            <span className={cn("h-2 w-2 rounded-full",
              connected ? "bg-success animate-pulse-glow" : "bg-muted-foreground/40"
            )} />
            <span className="text-[10px] text-muted-foreground font-mono">
              {connected ? "Live prices" : "Connecting…"}
            </span>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Wallet
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {liveWallets.map((wallet) => (
            <div key={wallet.id} className="card-gradient rounded-lg border border-border p-5 hover:border-primary/30 transition-all hover:glow-primary animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {wallet.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{wallet.symbol}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">${wallet.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-muted-foreground font-mono">{wallet.balance} {wallet.symbol}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-mono font-medium",
                    wallet.change24h >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h.toFixed(2)}% 24h
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <code className="text-[10px] text-muted-foreground font-mono flex-1 truncate">{wallet.address}</code>
                  <button onClick={() => { navigator.clipboard.writeText(wallet.address); toast.success("Address copied!"); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* On-chain stats from mempool.space */}
        <div className="card-gradient rounded-lg border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bitcoin className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">On-chain BTC tracker</h3>
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">mempool.space</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Address balance" value={stats ? `${stats.balanceBtc.toFixed(4)} BTC` : "…"} />
            <Stat label="USD value"
              value={stats && prices.BTC ? `$${(stats.balanceBtc * prices.BTC.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…"} />
            <Stat label="Tx count" value={stats ? stats.txCount.toLocaleString() : "…"} />
            <Stat label="Recommended fee" value={feeEstimate ? `${feeEstimate} sat/vB` : "…"} icon={Activity} />
          </div>
        </div>

        <div className="card-gradient rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Transaction History</h3>
          {dbTxView.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No transactions yet. Make a payment or trade to populate this list.</p>
          ) : (
            <TransactionList transactions={dbTxView} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/40 border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      </div>
      <p className="text-sm font-mono font-semibold text-foreground">{value}</p>
    </div>
  );
}
