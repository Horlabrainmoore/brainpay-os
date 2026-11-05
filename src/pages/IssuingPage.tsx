import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatUsd, validateTransferAmount } from "@/lib/issuing";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowRight, BadgeAlert, CheckCircle2, Vault } from "lucide-react";

interface Balances {
  available_usd: string | number;
  issuing_usd: string | number;
}

interface Transfer {
  id: string;
  amount_usd: string | number;
  status: string;
  note: string | null;
  created_at: string;
}

export default function IssuingPage() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [amount, setAmount] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: b }, { data: t }] = await Promise.all([
      supabase.from("issuing_balances").select("available_usd, issuing_usd").eq("user_id", user.id).maybeSingle(),
      supabase.from("issuing_transfers").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (b) setBalances(b as Balances);
    if (t) setTransfers(t as Transfer[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const available = Number(balances?.available_usd ?? 0);
  const issuing = Number(balances?.issuing_usd ?? 0);

  const submit = () => {
    const result = validateTransferAmount(amount, available);
    if (!result.ok) {
      setValidation(result.error ?? "Invalid amount");
      return;
    }
    setValidation(null);
    setConfirmOpen(true);
  };

  const confirmTransfer = async () => {
    const parsed = validateTransferAmount(amount, available);
    if (!parsed.ok) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("issuing-transfer", { body: { amount: parsed.amount } });
      if (error) throw error;
      if (data?.ok) {
        toast.success(`Transferred ${formatUsd(parsed.amount!)} to Issuing Balance`);
        setConfirmOpen(false);
        setAmount("");
        await load();
      } else {
        toast.error(data?.error ?? "Transfer failed");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Issuing" subtitle="Fund card issuing from your USD balance">
      <div className="max-w-3xl space-y-6">
        <div className="flex items-start gap-3 p-3 rounded-lg border border-warning/30 bg-warning/5">
          <BadgeAlert className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">Sandbox mode.</span> These balances are simulated for testing
            the issuing flow. Real card issuing and money movement stay disabled until KoraPay sandbox credentials are
            connected.
          </p>
        </div>

        {!balances ? (
          <div className="card-gradient rounded-lg border border-border p-6">
            <p className="text-xs text-muted-foreground">
              No issuing account yet. Your sandbox balance is created the first time the workspace owner signs in —
              reload this page, or contact the workspace admin.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-gradient rounded-lg border border-border p-5">
                <p className="text-xs text-muted-foreground">USD Available Balance</p>
                <p className="text-2xl font-bold text-foreground mt-1 font-mono">{formatUsd(available)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Funding source for transfers to issuing</p>
              </div>
              <div className="card-gradient rounded-lg border border-primary/30 p-5">
                <div className="flex items-center gap-2">
                  <Vault className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">USD Issuing Balance</p>
                </div>
                <p className="text-2xl font-bold text-foreground mt-1 font-mono">{formatUsd(issuing)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">Funds virtual card creation and card fees</p>
              </div>
            </div>

            <div className="card-gradient rounded-lg border border-border p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Add funds to Issuing Balance</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transfer from USD Available Balance. You must keep sufficient available funds for other operations.
                </p>
              </div>
              <div className="space-y-1.5 max-w-xs">
                <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setValidation(validateTransferAmount(e.target.value, available).error ?? null);
                  }}
                  className="font-mono"
                />
                {validation && <p className="text-[11px] text-destructive">{validation}</p>}
              </div>
              <Button onClick={submit} disabled={!amount.trim() || Boolean(validation)}>
                <span className="flex items-center gap-2">
                  Transfer to Issuing <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Button>
            </div>
          </>
        )}

        <div className="card-gradient rounded-lg border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Transfer history</h3>
          {transfers.length === 0 ? (
            <p className="text-xs text-muted-foreground">No transfers yet.</p>
          ) : (
            <div className="space-y-2">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center gap-3 text-xs p-3 rounded-lg bg-secondary/20 border border-border">
                  {t.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="font-mono text-foreground">{formatUsd(Number(t.amount_usd))}</span>
                  <span className="text-muted-foreground">Available → Issuing</span>
                  <span className="ml-auto text-muted-foreground">{new Date(t.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm transfer</DialogTitle>
            <DialogDescription>
              Move {formatUsd(Number(amount) || 0)} from USD Available Balance to USD Issuing Balance? This cannot be
              undone automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmTransfer} disabled={submitting}>
              {submitting ? "Transferring…" : "Confirm transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
