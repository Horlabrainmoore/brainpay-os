import { TradeSignal } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const signalConfig = {
  buy: { icon: TrendingUp, label: 'BUY', className: 'text-success border-success/30 bg-success/5' },
  sell: { icon: TrendingDown, label: 'SELL', className: 'text-destructive border-destructive/30 bg-destructive/5' },
  hold: { icon: Minus, label: 'HOLD', className: 'text-warning border-warning/30 bg-warning/5' },
};

export function SignalCard({ signal }: { signal: TradeSignal }) {
  const config = signalConfig[signal.type];
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg border p-4 space-y-3 transition-colors hover:border-primary/30", config.className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-bold font-mono">{config.label}</span>
          <span className="text-sm font-semibold text-foreground">{signal.pair}</span>
        </div>
        <span className="text-sm font-mono text-foreground">${signal.price.toLocaleString()}</span>
      </div>
      <div className="flex items-center gap-2">
        <Brain className="h-3 w-3 text-muted-foreground" />
        <p className="text-xs text-muted-foreground flex-1">{signal.aiReason}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-mono text-foreground">{signal.confidence}%</span>
          </div>
          <Progress value={signal.confidence} className="h-1.5" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Risk</p>
          <p className={cn("text-xs font-mono font-semibold",
            signal.riskScore < 35 ? "text-success" : signal.riskScore < 60 ? "text-warning" : "text-destructive"
          )}>{signal.riskScore}/100</p>
        </div>
      </div>
    </div>
  );
}
