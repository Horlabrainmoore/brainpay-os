import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox, Search, Bitcoin } from "lucide-react";
import { getAddressUtxos, getBlockHeight, validateBitcoinAddress } from "@/services/mempool";

interface UtxoRow {
  txid: string;
  vout: number;
  value: number;
  status: { confirmed: boolean; block_height?: number; block_time?: number };
}

const DEMO = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

export default function WalletUtxosPage() {
  const [input, setInput] = useState(DEMO);
  const [address, setAddress] = useState<string | null>(DEMO);
  const [utxos, setUtxos] = useState<UtxoRow[] | null>(null);
  const [tipHeight, setTipHeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => (input ? validateBitcoinAddress(input) : null), [input]);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUtxos(null);
    (async () => {
      try {
        const [list, height] = await Promise.all([getAddressUtxos(address), getBlockHeight()]);
        if (cancelled) return;
        setUtxos(list as UtxoRow[]);
        setTipHeight(height);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load UTXOs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const totals = useMemo(() => {
    if (!utxos) return { spendable: 0, unconfirmed: 0, count: 0 };
    const conf = utxos.filter((u) => u.status.confirmed);
    const unc = utxos.filter((u) => !u.status.confirmed);
    return {
      spendable: conf.reduce((s, u) => s + u.value, 0),
      unconfirmed: unc.reduce((s, u) => s + u.value, 0),
      count: utxos.length,
    };
  }, [utxos]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation?.valid) return;
    setAddress(input.trim());
  };

  return (
    <DashboardLayout title="Wallet UTXOs" subtitle="Spendable outputs for a Bitcoin address">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-primary" /> UTXO Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">BTC Address</Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={DEMO}
                  spellCheck={false}
                  className="font-mono text-xs flex-1 min-w-[260px]"
                />
                <Button type="submit" disabled={!validation?.valid || loading}>
                  <Search className="h-4 w-4" /> Fetch UTXOs
                </Button>
              </div>
              {input && validation && !validation.valid && (
                <p className="text-xs text-destructive">{validation.error}</p>
              )}
            </form>
          </CardContent>
        </Card>

        {address && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total UTXOs" value={totals.count.toLocaleString()} />
            <StatCard label="Spendable (confirmed)" value={`${(totals.spendable / 1e8).toFixed(8)} BTC`} />
            <StatCard label="Unconfirmed" value={`${(totals.unconfirmed / 1e8).toFixed(8)} BTC`} />
          </div>
        )}

        {address && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outputs</CardTitle>
              <p className="text-[10px] font-mono text-muted-foreground truncate">{address}</p>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <Alert variant="destructive" className="m-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Lookup failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {loading && (
                <div className="p-6 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )}
              {!loading && utxos && utxos.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Inbox className="h-6 w-6" /> No spendable outputs found.
                </div>
              )}
              {!loading && utxos && utxos.length > 0 && (
                <div className="divide-y divide-border">
                  {utxos.map((u) => {
                    const confs =
                      u.status.confirmed && u.status.block_height && tipHeight
                        ? tipHeight - u.status.block_height + 1
                        : 0;
                    return (
                      <div
                        key={`${u.txid}:${u.vout}`}
                        className="grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-secondary/30"
                      >
                        <a
                          href={`https://mempool.space/tx/${u.txid}`}
                          target="_blank"
                          rel="noreferrer"
                          className="col-span-12 md:col-span-6 text-xs font-mono text-primary truncate hover:underline"
                        >
                          {u.txid}:{u.vout}
                        </a>
                        <div className="col-span-4 md:col-span-2 text-xs">
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-mono text-foreground">{(u.value / 1e8).toFixed(8)} BTC</p>
                        </div>
                        <div className="col-span-4 md:col-span-2 text-xs">
                          <p className="text-muted-foreground">Sats</p>
                          <p className="font-mono text-foreground">{u.value.toLocaleString()}</p>
                        </div>
                        <div className="col-span-4 md:col-span-2 text-xs text-right">
                          {u.status.confirmed ? (
                            <Badge variant="secondary" className="text-[10px]">
                              {confs.toLocaleString()} conf
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] border-warning text-warning">
                              mempool
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-gradient rounded-lg border border-border p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-mono font-semibold text-foreground">{value}</p>
    </div>
  );
}
