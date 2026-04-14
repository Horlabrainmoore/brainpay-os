import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  subtitle?: string;
}

export function MetricCard({ title, value, change, changeType = 'neutral', icon: Icon, subtitle }: MetricCardProps) {
  return (
    <div className="card-gradient rounded-lg border border-border p-4 hover:border-primary/30 transition-colors animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
          <div className="flex items-center gap-1.5">
            {change && (
              <span className={cn("text-xs font-mono font-medium",
                changeType === 'positive' && "text-success",
                changeType === 'negative' && "text-destructive",
                changeType === 'neutral' && "text-muted-foreground",
              )}>
                {change}
              </span>
            )}
            {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
