import { useMemo } from "react";
import { useFeeEstimates } from "@/hooks/useMempool";
import { useLiveBlocks } from "@/hooks/useLiveBlocks";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Activity, Layers } from "lucide-react";

/**
 * Dashboard charts:
 *  - Recommended fee rates (fastest / 30min / 1h / economy / minimum) in sat/vB
 *  - Fee-range percentiles (min, 10th, 50th, 90th, max) of recent blocks
 */
export function MempoolFeeCharts() {
  const { data: fees, isLoading: feesLoading } = useFeeEstimates();
  const { blocks, status } = useLiveBlocks(10);

  const feeData = useMemo(() => {
    if (!fees) return [];
    return [
      { tier: "Fastest", rate: fees.fastestFee },
      { tier: "30min", rate: fees.halfHourFee },
      { tier: "1h", rate: fees.hourFee },
      { tier: "Economy", rate: fees.economyFee },
      { tier: "Minimum", rate: fees.minimumFee },
    ];
  }, [fees]);

  const rangeData = useMemo(() => {
    return blocks
      .slice()
      .reverse()
      .map((b) => {
        const r = b.extras?.feeRange ?? [0, 0, 0, 0, 0, 0, 0];
        return {
          height: b.height,
          min: r[0] ?? 0,
          p10: r[1] ?? 0,
          median: r[Math.floor(r.length / 2)] ?? 0,
          p90: r[r.length - 2] ?? 0,
          max: r[r.length - 1] ?? 0,
        };
      });
  }, [blocks]);

  const tooltipStyle = {
    background: "hsl(220, 18%, 12%)",
    border: "1px solid hsl(220, 14%, 18%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(210, 20%, 95%)",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card-gradient rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommended fee rates</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">sat/vB</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={feeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis dataKey="tier" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} sat/vB`, "Rate"]} />
            <Bar dataKey="rate" radius={[4, 4, 0, 0]} fill="hsl(160, 84%, 39%)" />
          </BarChart>
        </ResponsiveContainer>
        {feesLoading && <p className="text-[10px] text-muted-foreground mt-2">Loading fees…</p>}
      </div>

      <div className="card-gradient rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Fee range · recent blocks</h3>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {status === "live" ? "live" : status}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rangeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis dataKey="height" tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name) => [`${Number(v).toFixed(1)} sat/vB`, name]} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="min" stackId="a" fill="hsl(215, 20%, 30%)" />
            <Bar dataKey="p10" stackId="a" fill="hsl(200, 60%, 45%)" />
            <Bar dataKey="median" stackId="a" fill="hsl(160, 84%, 39%)" />
            <Bar dataKey="p90" stackId="a" fill="hsl(40, 90%, 55%)" />
            <Bar dataKey="max" stackId="a" fill="hsl(0, 75%, 55%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
