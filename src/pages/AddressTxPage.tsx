import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, Search, Inbox } from "lucide-react";
import mempoolJS from "@mempool/mempool.js";
import { validateBtcAddress } from "@/lib/btc-address";

interface MempoolTx {
  txid: string;
  fee: number;
  size: number;
  weight: number;
  status: { confirmed: boolean; block_height?: number; block_time?: number };
}

const PAGE_SIZE = 25;

export default function AddressTxPage() {
  const [input, setInput] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [txs, setTxs] = useState<MempoolTx[] | null>(null);
  const [tipHeight, setTipHeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const liveValidation = useMemo(() => {
    if (!input) return null;
    return validateBtcAddress(input);
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateBtcAddress(input);
    if (!v.valid) {
      setValidationMsg(v.reason ?? "Invalid address.");
      setKind(null);
      return;
    }
    setValidationMsg(null);
    setKind(v.kind);
    setAddress(input.trim());
    setPage(1);
  };

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTxs(null);
    const { bitcoin } = mempoolJS({ hostname: "mempool.space" });
    (async () => {
      try {
        const [list, height] = await Promise.all([
          bitcoin.addresses.getAddressTxs({ address }),
          bitcoin.blocks.getBlocksTipHeight(),
        ]);
        if (cancelled) return;
        setTxs(list as MempoolTx[]);
        setTipHeight(Number(height));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load transactions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const totalPages = txs ? Math.max(1, Math.ceil(txs.length / PAGE_SIZE)) : 1;
  const pageTxs = txs ? txs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  return (
    <DashboardLayout title="Address Tx Viewer" subtitle="Inspect any BTC address">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Address Transaction Viewer</h1>
          <p className="text-sm text-muted-foreground">
            Enter any Bitcoin mainnet address to inspect its transactions, confirmations, fee rate, and vsize.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lookup Address</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Label htmlFor="btc-addr" className="text-xs uppercase tracking-wider text-muted-foreground">
                BTC Address
              </Label>
              <div className="flex gap-2 flex-wrap">
                <Input
                  id="btc-addr"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                  maxLength={90}
                  spellCheck={false}
                  autoComplete="off"
                  className="font-mono text-xs flex-1 min-w-[260px]"
                />
                <Button type="submit" disabled={!input || (liveValidation && !liveValidation.valid) || loading}>
                  <Search className="h-4 w-4" /> Lookup
                </Button>
              </div>

              {input && liveValidation && !liveValidation.valid && (
                <p className="text-xs text-destructive">{liveValidation.reason}</p>
              )}
              {input && liveValidation?.valid && (
                <p className="text-xs text-muted-foreground">
                  Detected format: <span className="font-mono text-success">{liveValidation.kind}</span>
                </p>
              )}
              {validationMsg && !liveValidation?.valid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Invalid address</AlertTitle>
                  <AlertDescription>{validationMsg}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {address && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="min-w-0">
                <CardTitle className="text-base">Transactions</CardTitle>
                <p className="text-[10px] font-mono text-muted-foreground truncate mt-1">{address}</p>
              </div>
              <div className="flex gap-2 items-center">
                {kind && <Badge variant="outline" className="text-[10px]">{kind}</Badge>}
                {txs && (
                  <Badge variant="secondary" className="text-[10px]">
                    {txs.length} tx{txs.length === 1 ? "" : "s"}
                  </Badge>
                )}
              </div>
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
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              )}

              {!loading && txs && txs.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Inbox className="h-6 w-6" />
                  No transactions found for this address.
                </div>
              )}

              {!loading && pageTxs.length > 0 && (
                <>
                  <div className="divide-y divide-border">
                    {pageTxs.map((t) => {
                      const vsize = Math.ceil(t.weight / 4);
                      const feeRate = vsize > 0 ? (t.fee / vsize).toFixed(2) : "—";
                      const confirmations =
                        t.status.confirmed && t.status.block_height && tipHeight
                          ? tipHeight - t.status.block_height + 1
                          : 0;
                      return (
                        <div key={t.txid} className="grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-secondary/30 transition-colors">
                          <a
                            href={`https://mempool.space/tx/${t.txid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="col-span-12 md:col-span-5 text-xs font-mono text-primary truncate hover:underline"
                          >
                            {t.txid}
                          </a>
                          <div className="col-span-4 md:col-span-2 text-xs">
                            <p className="text-muted-foreground">Confirmations</p>
                            <p className="font-mono text-foreground">
                              {confirmations > 0 ? confirmations.toLocaleString() : <span className="text-warning">unconfirmed</span>}
                            </p>
                          </div>
                          <div className="col-span-4 md:col-span-2 text-xs">
                            <p className="text-muted-foreground">Fee rate</p>
                            <p className="font-mono text-foreground">{feeRate} sat/vB</p>
                          </div>
                          <div className="col-span-4 md:col-span-2 text-xs">
                            <p className="text-muted-foreground">vSize</p>
                            <p className="font-mono text-foreground">{vsize.toLocaleString()} vB</p>
                          </div>
                          <div className="col-span-12 md:col-span-1 text-xs text-right">
                            <p className="text-muted-foreground">Fee</p>
                            <p className="font-mono text-foreground">{t.fee.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" /> Prev
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
