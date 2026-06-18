import { DashboardLayout } from "@/components/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { TransactionList } from "@/components/TransactionList";
import { CreditCard, ArrowRightLeft, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTransactions } from "@/hooks/useTransactions";
import { Transaction } from "@/lib/mock-data";

export default function PaymentsPage() {
  const [amount, setAmount] = useState("");
  const [route, setRoute] = useState<'card' | 'crypto'>('card');
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const { transactions, addTransaction } = useTransactions();

  const handlePayment = async () => {
    const amt = Number(amount);
    if (!amount || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 900));
    const fee = route === 'card' ? amt * 0.029 : amt * 0.001;
    const { error } = await addTransaction({
      type: 'payment',
      asset: 'USD',
      amount: amt,
      usd_value: amt,
      status: 'completed',
      description: `Payment via ${route} (fee $${fee.toFixed(2)})`,
      metadata: { route, fee },
    });
    setProcessing(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Payment of $${amount} processed via ${route}`, {
      description: `Route: ${route === 'card' ? 'Card Network' : 'Blockchain'} | Fee: ${route === 'card' ? '2.9%' : '0.1%'}`
    });
    setAmount("");
    setCardNumber("");
  };

  const cardFee = Number(amount) * 0.029;
  const cryptoFee = Number(amount) * 0.001;

  const recentPayments: Transaction[] = transactions
    .filter((t) => t.type === 'payment')
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      type: 'payment',
      amount: Number(t.amount),
      currency: t.asset,
      description: t.description ?? "Payment",
      timestamp: t.created_at,
      status: (["completed", "pending", "failed"].includes(t.status) ? t.status : "completed") as Transaction["status"],
      route: (t.metadata?.route as Transaction["route"]) ?? 'card',
    }));

  return (
    <DashboardLayout title="Payments" subtitle="Process and route payments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Total Processed" value="$12,450" change="+18%" changeType="positive" icon={CreditCard} subtitle="this month" />
          <MetricCard title="Fees Saved" value="$342" change="via crypto routing" changeType="positive" icon={Zap} />
          <MetricCard title="Success Rate" value="96.8%" change="+0.5%" changeType="positive" icon={Shield} />
          <MetricCard title="Avg Route Time" value="1.2s" change="-0.3s" changeType="positive" icon={ArrowRightLeft} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card-gradient rounded-lg border border-border p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Make Payment</h3>
              <p className="text-xs text-muted-foreground mt-1">Simulated tokenized payment</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Amount (USD)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                  className="font-mono bg-secondary border-border" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Payment Route</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['card', 'crypto'] as const).map(r => (
                    <button key={r} onClick={() => setRoute(r)}
                      className={cn("p-3 rounded-lg border text-left transition-all",
                        route === r ? "border-primary bg-primary/5" : "border-border bg-secondary hover:border-muted-foreground/30"
                      )}>
                      <div className="flex items-center gap-2 mb-1">
                        {r === 'card' ? <CreditCard className="h-4 w-4 text-warning" /> : <Zap className="h-4 w-4 text-primary" />}
                        <span className="text-xs font-semibold text-foreground capitalize">{r}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Fee: {r === 'card' ? '2.9%' : '0.1%'}</p>
                      {amount && <p className="text-[10px] font-mono text-foreground mt-1">
                        ${(r === 'card' ? cardFee : cryptoFee).toFixed(2)}
                      </p>}
                    </button>
                  ))}
                </div>
              </div>

              {route === 'card' && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Card Number (tokenized)</label>
                  <Input placeholder="4242 4242 4242 4242" value={cardNumber}
                    onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    maxLength={19} className="font-mono bg-secondary border-border" />
                </div>
              )}

              <Button onClick={handlePayment} disabled={processing} className="w-full mt-2">
                {processing ? "Processing..." : `Pay $${amount || '0.00'} via ${route}`}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-gradient rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Routing Logic</h3>
              <p className="text-xs text-muted-foreground mb-3">How payments are intelligently routed</p>
              <div className="space-y-2.5">
                {[
                  { rule: 'Amount > $500', route: 'Crypto', reason: 'Lower fees on large amounts', active: Number(amount) > 500 },
                  { rule: 'Amount ≤ $500', route: 'Card', reason: 'Faster for small payments', active: Number(amount) <= 500 && Number(amount) > 0 },
                  { rule: 'Recurring payment', route: 'Card', reason: 'Automatic billing support', active: false },
                  { rule: 'International', route: 'Crypto', reason: 'No FX fees', active: false },
                ].map((item, i) => (
                  <div key={i} className={cn("flex items-center gap-3 p-2.5 rounded-lg text-xs transition-colors",
                    item.active ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"
                  )}>
                    <div className={cn("h-2 w-2 rounded-full shrink-0", item.active ? "bg-primary" : "bg-muted-foreground/30")} />
                    <div className="flex-1">
                      <span className="font-medium text-foreground">{item.rule}</span>
                      <span className="text-muted-foreground"> → {item.route}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-gradient rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Payments</h3>
              {recentPayments.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2">No payments yet.</p>
              ) : (
                <TransactionList transactions={recentPayments} compact />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
