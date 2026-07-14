import { Transaction } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TxChainStatus } from "@/components/TxChainStatus";

const typeConfig = {
  send: { icon: ArrowUpRight, label: 'Sent', color: 'text-destructive' },
  receive: { icon: ArrowDownLeft, label: 'Received', color: 'text-success' },
  trade: { icon: TrendingUp, label: 'Trade', color: 'text-info' },
  payment: { icon: CreditCard, label: 'Payment', color: 'text-warning' },
};

interface TransactionListProps {
  transactions: Transaction[];
  compact?: boolean;
}

export function TransactionList({ transactions, compact = false }: TransactionListProps) {
  return (
    <div className="space-y-1">
      {transactions.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        return (
          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-secondary", config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
              {!compact && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {tx.route && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border">
                      {tx.route}
                    </Badge>
                  )}
                  {tx.txid && <TxChainStatus txid={tx.txid} />}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className={cn("text-sm font-mono font-medium", config.color)}>
                {tx.type === 'send' || tx.type === 'payment' ? '-' : '+'}{tx.amount} {tx.currency}
              </p>
              <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}
                className="text-[9px] px-1.5 py-0 h-4">
                {tx.status}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
