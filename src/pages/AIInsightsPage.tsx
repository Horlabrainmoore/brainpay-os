import { DashboardLayout } from "@/components/DashboardLayout";
import { aiInsights } from "@/lib/mock-data";
import { Brain, TrendingUp, ArrowUpRight, Shield, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const typeConfig = {
  trade: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
  route: { icon: ArrowUpRight, color: 'text-info', bg: 'bg-info/10', border: 'border-info/20' },
  risk: { icon: Shield, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
  alert: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20' },
};

export default function AIInsightsPage() {
  return (
    <DashboardLayout title="AI Insights" subtitle="AI-driven decisions and recommendations">
      <div className="space-y-6">
        {/* AI summary */}
        <div className="card-gradient rounded-lg border border-border p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(160,84%,39%,0.08),transparent_60%)]" />
          <div className="relative flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center glow-primary">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">BrainPay AI Engine</h3>
              <p className="text-xs text-muted-foreground">Neural network v3.2 • Last trained: 2h ago • Accuracy: 91.3%</p>
            </div>
          </div>
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Active Signals', value: '5', sub: 'trade signals' },
              { label: 'Avg Confidence', value: '84%', sub: 'across all' },
              { label: 'Decisions Today', value: '23', sub: 'actions taken' },
              { label: 'Risk Score', value: 'Low', sub: '32/100' },
            ].map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-[9px] text-muted-foreground/70">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map(insight => {
            const config = typeConfig[insight.type];
            const Icon = config.icon;
            return (
              <div key={insight.id} className={cn("card-gradient rounded-lg border p-5 space-y-4 transition-all hover:glow-primary animate-slide-up", config.border)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", config.bg)}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{insight.type} • {new Date(insight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-mono text-foreground">{insight.confidence}%</span>
                  </div>
                  <Progress value={insight.confidence} className="h-1.5" />
                </div>
                {insight.action && (
                  <Button size="sm" variant="outline" className="w-full text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    onClick={() => toast.success(`Action: ${insight.action}`, { description: 'Simulated AI action executed' })}>
                    {insight.action}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
