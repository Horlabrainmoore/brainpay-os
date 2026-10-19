import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Activity, ArrowDownRight, ArrowUpRight, Check, ChevronRight, CircleDot, Copy, Database, ExternalLink, GitBranch, Pause, Play, Radio, RefreshCw, Search, Server, Settings2, ShieldCheck, Terminal, Zap } from "lucide-react";

const events = [
  { time: "12:04:31.842", type: "Swap", chain: "Ethereum", hash: "0x8f...c21a", value: "$48,290", status: "processed" },
  { time: "12:04:31.614", type: "Transfer", chain: "Base", hash: "0x11...a90e", value: "$7,840", status: "processed" },
  { time: "12:04:30.997", type: "Mint", chain: "Solana", hash: "5nQ...x8P", value: "$2,140", status: "processed" },
  { time: "12:04:30.442", type: "Liquidity", chain: "Ethereum", hash: "0x42...fe10", value: "$120,500", status: "processed" },
];

const pipeline = [
  { label: "Bitquery", detail: "GraphQL subscription", icon: Database, tone: "text-chart-2" },
  { label: "Normalizer", detail: "Event schema v1.4", icon: Settings2, tone: "text-chart-4" },
  { label: "Kafka", detail: "blockchain.events", icon: Radio, tone: "text-primary" },
  { label: "Consumers", detail: "3 active workers", icon: Server, tone: "text-success" },
];

export default function Dashboard() {
  const [query, setQuery] = useState("ethereum.dex.trades");
  const [paused, setPaused] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const totalEvents = useMemo(() => paused ? "2.48M" : "2.51M", [paused]);

  const copy = async (text: string, message: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <DashboardLayout title="Signal pipeline" subtitle="Real-time blockchain intelligence, routed from Bitquery into your event streams.">
      <div className="flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-xl border border-primary/20 bg-card p-5 shadow-sm md:p-7">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2"><Badge variant="outline" className="border-success/30 bg-success/10 text-success"><CircleDot className="mr-1 size-3 fill-current" /> Stream healthy</Badge><span className="text-xs text-muted-foreground">Updated just now</span></div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Your on-chain data,<br /><span className="text-primary">in motion.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Connect live Bitquery subscriptions, normalize events, and publish production-ready topics without losing the context your consumers need.</p>
            </div>
            <div className="flex flex-wrap gap-2"><Button onClick={() => toast.success("Stream configuration saved")}><Zap data-icon="inline-start" /> Configure stream</Button><Button variant="outline" onClick={() => copy("https://api.thirdweb.com/v1", "API base URL copied")}><Copy data-icon="inline-start" /> API reference</Button></div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[{ label: "Events processed", value: totalEvents, delta: "+18.4%", icon: Activity }, { label: "Events / second", value: paused ? "0" : "184.6", delta: "steady", icon: Zap }, { label: "Active consumers", value: "3 / 3", delta: "100% healthy", icon: Server }, { label: "End-to-end lag", value: "420ms", delta: "-12ms", icon: ShieldCheck }].map((metric) => <Card key={metric.label}><CardContent className="p-4 md:p-5"><div className="flex items-start justify-between gap-2"><metric.icon className="size-4 text-muted-foreground" /><span className="text-[11px] text-success">{metric.delta}</span></div><p className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.label}</p></CardContent></Card>)}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between"><div><CardTitle className="text-sm">Pipeline topology</CardTitle><p className="mt-1 text-xs text-muted-foreground">Live event flow from source to your application.</p></div><div className="flex items-center gap-2"><Badge variant="secondary" className="font-mono text-[10px]">us-east-1</Badge><Button variant="ghost" size="sm" onClick={() => setPaused(!paused)}>{paused ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}{paused ? "Resume" : "Pause"}</Button></div></CardHeader>
          <CardContent className="overflow-x-auto p-5"><div className="flex min-w-[700px] items-center justify-between gap-3">{pipeline.map((node, index) => <div key={node.label} className="flex flex-1 items-center gap-3"><div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border bg-muted/20 p-3"><div className={`flex size-9 shrink-0 items-center justify-center rounded-md bg-background ${node.tone}`}><node.icon /></div><div className="min-w-0"><p className="truncate text-sm font-medium">{node.label}</p><p className="truncate text-[11px] text-muted-foreground">{node.detail}</p></div><Check className="ml-auto size-4 shrink-0 text-success" /></div>{index < pipeline.length - 1 && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}</div>)}</div></CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4"><TabsList className="w-fit"><TabsTrigger value="overview">Event stream</TabsTrigger><TabsTrigger value="query">OpenAPI query</TabsTrigger></TabsList><TabsContent value="overview" className="mt-0"><Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-sm">Recent events</CardTitle><p className="mt-1 text-xs text-muted-foreground">Topic: <span className="font-mono text-foreground">blockchain.events</span></p></div><Button variant="outline" size="sm" onClick={() => toast.success("Stream refreshed")}><RefreshCw data-icon="inline-start" /> Refresh</Button></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Time</th><th className="px-5 py-3 font-medium">Event</th><th className="px-5 py-3 font-medium">Chain</th><th className="px-5 py-3 font-medium">Transaction</th><th className="px-5 py-3 text-right font-medium">Value</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead><tbody>{events.map((event) => <tr key={event.time} className="border-b last:border-0"><td className="px-5 py-3 font-mono text-xs text-muted-foreground">{event.time}</td><td className="px-5 py-3 font-medium">{event.type}</td><td className="px-5 py-3"><Badge variant="outline" className="font-normal">{event.chain}</Badge></td><td className="px-5 py-3 font-mono text-xs text-muted-foreground">{event.hash}</td><td className="px-5 py-3 text-right font-mono text-xs">{event.value}</td><td className="px-5 py-3 text-right"><Badge variant="secondary" className="bg-success/10 text-success">{event.status}</Badge></td></tr>)}</tbody></table></div></CardContent></Card></TabsContent><TabsContent value="query" className="mt-0"><Card><CardHeader><CardTitle className="text-sm">Subscribe to an event stream</CardTitle><p className="mt-1 text-xs text-muted-foreground">Use the thirdweb API as your authenticated gateway for wallet and on-chain operations.</p></CardHeader><CardContent className="flex flex-col gap-4"><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9 font-mono text-xs" aria-label="Event stream query" /></div><Button onClick={() => toast.success(`Subscribed to ${query}`)}><GitBranch data-icon="inline-start" /> Subscribe</Button></div><pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 text-xs leading-6 text-muted-foreground"><code><span className="text-chart-2">POST</span> https://api.thirdweb.com/v1/gateway/events{`\n`}<span className="text-chart-4">x-client-id:</span> your-client-id{`\n`}<span className="text-chart-4">x-secret-key:</span> server-only{`\n`}{`{ "stream": "${query}", "delivery": "kafka" }`}</code></pre><p className="flex items-center gap-2 text-xs text-muted-foreground"><Terminal className="size-3" /> Credentials stay server-side. The browser receives validated stream status only.</p></CardContent></Card></TabsContent></Tabs>

        <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/10 p-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between"><span className="flex items-center gap-2"><ExternalLink className="size-3" /> Built for teams that need reliable on-chain observability.</span><Button variant="link" size="sm" className="h-auto justify-start p-0" onClick={() => window.location.assign("/settings")}>Manage workspace <ArrowUpRight data-icon="inline-end" /></Button></div>
      </div>
    </DashboardLayout>
  );
}
