import { DashboardLayout } from "@/components/DashboardLayout";
import { wallets, recentTransactions } from "@/lib/mock-data";
import { TransactionList } from "@/components/TransactionList";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function WalletsPage() {
  return (
    <DashboardLayout title="Wallets" subtitle="Manage your crypto and fiat wallets">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Your Wallets</h3>
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Add Wallet
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wallets.map((wallet) => (
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
                  <p className="text-2xl font-bold text-foreground">${wallet.usdValue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-mono">{wallet.balance} {wallet.symbol}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn("text-xs font-mono font-medium",
                    wallet.change24h >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {wallet.change24h >= 0 ? '+' : ''}{wallet.change24h}% 24h
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

        <div className="card-gradient rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Transaction History</h3>
          <TransactionList transactions={recentTransactions} />
        </div>
      </div>
    </DashboardLayout>
  );
}
