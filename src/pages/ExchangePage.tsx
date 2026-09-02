import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ExchangeError,
  accountInfo,
  bookTicker,
  depth,
  exchangeInfo,
  historyOrders,
  myTrades,
  openOrders,
  recentTrades,
  serverTime,
  ticker24h,
  type AccountInfo,
  type BookTicker,
  type Depth,
  type ExchangeInfo,
  type MyTrade,
  type Order,
  type RecentTrade,
  type Ticker24h,
} from "@/lib/exchange";
import { Activity, RefreshCw } from "lucide-react";

function err(e: unknown) {
  if (e instanceof ExchangeError) {
    toast.error(`${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`, {
      description: e.details?.slice(0, 300),
    });
  } else {
    toast.error(e instanceof Error ? e.message : String(e));
  }
}

const num = (v: string) => Number(v).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function ExchangePage() {
  const [symbol, setSymbol] = useState("ETHBTC");
  const [info, setInfo] = useState<ExchangeInfo | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [tick, setTick] = useState<Ticker24h | null>(null);
  const [book, setBook] = useState<BookTicker | null>(null);
  const [dep, setDep] = useState<Depth | null>(null);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [open, setOpen] = useState<Order[]>([]);
  const [history, setHistory] = useState<Order[]>([]);
  const [fills, setFills] = useState<MyTrade[]>([]);
  const [busy, setBusy] = useState(false);

  async function loadMeta() {
    try {
      const started = Date.now();
      await serverTime();
      setLatency(Date.now() - started);
      setInfo(await exchangeInfo());
    } catch (e) {
      err(e);
    }
  }

  async function loadMarket() {
    setBusy(true);
    try {
      const [t, b, d, tr] = await Promise.all([
        ticker24h(symbol),
        bookTicker(symbol),
        depth(symbol, 20),
        recentTrades(symbol, 50),
      ]);
      setTick(Array.isArray(t) ? (t[0] ?? null) : t);
      setBook(Array.isArray(b) ? (b[0] ?? null) : b);
      setDep(d);
      setTrades(tr);
    } catch (e) {
      err(e);
    } finally {
      setBusy(false);
    }
  }

  async function loadAccount() {
    setBusy(true);
    try {
      const [a, o, h, f] = await Promise.all([
        accountInfo(),
        openOrders(symbol || undefined),
        historyOrders(symbol || undefined),
        myTrades(),
      ]);
      setAccount(a);
      setOpen(o);
      setHistory(h);
      setFills(f);
    } catch (e) {
      err(e);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DashboardLayout title="Exchange" subtitle="Public REST API (2018-09-25)">
      <div className="space-y-6">
        <Card className="card-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Connection
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadMeta}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Ping
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                latency {latency ?? "—"} ms
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                symbols {info?.symbols.length ?? "—"}
              </Badge>
              {info?.rateLimits.map((r) => (
                <Badge key={`${r.rateLimitType}-${r.interval}`} variant="outline" className="font-mono text-[10px]">
                  {r.rateLimitType} {r.limit}/{r.interval.toLowerCase()}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Signed (TRADE / USER_DATA) requests are HMAC-SHA256 signed inside the backend — your API key and
              secret never reach the browser. Rate-limit responses (429 / 418) are surfaced verbatim so you can
              back off.
            </p>
            <div className="flex gap-2">
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="ETHBTC"
                className="max-w-[180px] font-mono"
              />
              <Button onClick={loadMarket} disabled={busy || !symbol}>
                Load market data
              </Button>
              <Button variant="outline" onClick={loadAccount} disabled={busy}>
                Load account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="market">
          <TabsList>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="book">Order book</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4 pt-4">
            <Card className="card-gradient">
              <CardHeader><CardTitle className="text-base">24h ticker — {symbol}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {tick ? (
                  <>
                    <Stat label="Last" value={num(tick.lastPrice)} />
                    <Stat label="Open" value={num(tick.openPrice)} />
                    <Stat label="High" value={num(tick.highPrice)} />
                    <Stat label="Low" value={num(tick.lowPrice)} />
                    <Stat label="Volume" value={num(tick.volume)} />
                    <Stat label="Best bid" value={book ? num(book.bidPrice) : "—"} />
                    <Stat label="Best ask" value={book ? num(book.askPrice) : "—"} />
                    <Stat label="Time" value={new Date(tick.time).toLocaleTimeString()} />
                  </>
                ) : (
                  <p className="text-muted-foreground col-span-full">Load market data to populate.</p>
                )}
              </CardContent>
            </Card>
            <Card className="card-gradient">
              <CardHeader><CardTitle className="text-base">Recent trades</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-80 overflow-auto">
                {trades.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
                {trades.map((t, i) => (
                  <div key={`${t.time}-${i}`} className="flex justify-between text-xs font-mono">
                    <span className={t.isBuyerMaker ? "text-destructive" : "text-primary"}>{num(t.price)}</span>
                    <span className="text-muted-foreground">{num(t.qty)}</span>
                    <span className="text-muted-foreground">{new Date(t.time).toLocaleTimeString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="book" className="pt-4">
            <Card className="card-gradient">
              <CardHeader><CardTitle className="text-base">Order book — {symbol}</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-6 text-xs font-mono">
                <div className="space-y-1">
                  <p className="text-primary mb-2">Bids</p>
                  {(dep?.bids ?? []).map(([p, q], i) => (
                    <div key={`b${i}`} className="flex justify-between">
                      <span className="text-primary">{num(p)}</span>
                      <span className="text-muted-foreground">{num(q)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-destructive mb-2">Asks</p>
                  {(dep?.asks ?? []).map(([p, q], i) => (
                    <div key={`a${i}`} className="flex justify-between">
                      <span className="text-destructive">{num(p)}</span>
                      <span className="text-muted-foreground">{num(q)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="pt-4">
            <Card className="card-gradient">
              <CardHeader><CardTitle className="text-base">Balances</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {!account ? (
                  <p className="text-sm text-muted-foreground">Load account to view signed data.</p>
                ) : (
                  <>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{account.canTrade ? "can trade" : "trading off"}</Badge>
                      <Badge variant="outline">{account.canDeposit ? "can deposit" : "deposit off"}</Badge>
                      <Badge variant="outline">{account.canWithdraw ? "can withdraw" : "withdraw off"}</Badge>
                    </div>
                    {account.balances
                      .filter((b) => Number(b.free) > 0 || Number(b.locked) > 0)
                      .map((b) => (
                        <div key={b.asset} className="flex justify-between text-xs font-mono">
                          <span className="text-foreground">{b.asset}</span>
                          <span className="text-muted-foreground">
                            {num(b.free)} free · {num(b.locked)} locked
                          </span>
                        </div>
                      ))}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 pt-4">
            <OrderTable title="Open orders" rows={open} />
            <OrderTable title="Order history" rows={history} />
            <Card className="card-gradient">
              <CardHeader><CardTitle className="text-base">My fills</CardTitle></CardHeader>
              <CardContent className="space-y-1 max-h-80 overflow-auto">
                {fills.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
                {fills.map((f) => (
                  <div key={f.id} className="flex justify-between text-xs font-mono">
                    <span>{f.symbol}</span>
                    <span className={f.isBuyer ? "text-primary" : "text-destructive"}>
                      {f.isBuyer ? "BUY" : "SELL"} {num(f.qty)} @ {num(f.price)}
                    </span>
                    <span className="text-muted-foreground">{new Date(f.time).toLocaleString()}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function OrderTable({ title, rows }: { title: string; rows: Order[] }) {
  return (
    <Card className="card-gradient">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1 max-h-80 overflow-auto">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data.</p>}
        {rows.map((o) => (
          <div key={o.orderId} className="flex flex-wrap justify-between gap-2 text-xs font-mono">
            <span>{o.symbol}</span>
            <span className={o.side === "BUY" ? "text-primary" : "text-destructive"}>
              {o.side} {o.type} {num(o.origQty)} @ {num(o.price)}
            </span>
            <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
            <span className="text-muted-foreground">{new Date(o.time).toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
