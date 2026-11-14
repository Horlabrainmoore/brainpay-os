import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/utils";

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usdAvailable: number;
  usdIssuing: number;
  onConfirm: (amount: number) => Promise<{ error: string | null }>;
}

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function AddFundsDialog({ open, onOpenChange, usdAvailable, usdIssuing, onConfirm }: AddFundsDialogProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const amount = Number(trimmed);
  const isFormatValid = AMOUNT_PATTERN.test(trimmed) && amount > 0;
  const exceedsAvailable = isFormatValid && Math.round(amount * 100) > Math.round(usdAvailable * 100);
  const canSubmit = isFormatValid && !exceedsAvailable && !submitting;

  let hint = "Enter an amount with up to 2 decimal places.";
  if (exceedsAvailable) hint = `Amount exceeds your USD Available Balance of ${formatUsd(usdAvailable)}.`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const { error } = await onConfirm(amount);
    setSubmitting(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(`Added ${formatUsd(amount)} to your Issuing Balance`);
    setValue("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            Move USD from your available balance to your Issuing Balance. Issuing Balance funds virtual card creation, card funding, and fees.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">USD Available</p>
              <p className="font-mono font-semibold text-foreground">{formatUsd(usdAvailable)}</p>
            </div>
            <div className="rounded-md bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">USD Issuing (current)</p>
              <p className="font-mono font-semibold text-foreground">{formatUsd(usdIssuing)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fund-amount">Amount (USD)</Label>
            <Input
              id="fund-amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
            />
            <p className={exceedsAvailable ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>{hint}</p>
          </div>

          {isFormatValid && !exceedsAvailable && (
            <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <span className="text-muted-foreground">Resulting Issuing Balance</span>
              <span className="font-mono font-semibold text-success">{formatUsd(usdIssuing + amount)}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Transferring…" : "Confirm transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
