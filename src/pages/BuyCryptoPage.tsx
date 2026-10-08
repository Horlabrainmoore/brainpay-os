import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { ExternalLink, Loader2 } from "lucide-react";
import { validateBtcAddress, isTestnetAddress } from "@/lib/btc-address";

const schema = z.object({
  amount: z.number().min(10, "Minimum €10").max(100000),
  wallet: z.string().trim().min(10, "Enter a valid wallet address").max(128),
});

export default function BuyCryptoPage() {
  const [params] = useSearchParams();
  const [amount, setAmount] = useState("50");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);

  async function buy() {
    const v = schema.safeParse({ amount: Number(amount), wallet });
    if (!v.success) return toast.error(v.error.issues[0]?.message ?? "Check your purchase details");
    const addressCheck = validateBtcAddress(v.data.wallet);
    if (!addressCheck.valid || isTestnetAddress(v.data.wallet)) {
      return toast.error("Enter a valid Bitcoin mainnet address");
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("btcdirect-checkout", {
        body: {
          baseCurrency: "BTC", quoteCurrency: "EUR", paymentMethod: "creditCard",
          quoteCurrencyAmount: v.data.amount, walletAddress: v.data.wallet,
          returnUrl: `${window.location.origin}/buy?status=returned`,
        },
      });
      if (error) {
        const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
        throw new Error(details);
      }
      if (data?.error) throw new Error(data.details ? `${data.error}: ${data.details}` : data.error);
      const checkout = new URL(data.data.checkoutUrl);
      if (checkout.protocol !== "https:" || !checkout.hostname.endsWith(".btcdirect.eu")) {
        throw new Error("BTC Direct returned an unexpected checkout address. No redirect was made.");
      }
      window.location.assign(checkout.href);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <DashboardLayout title="Buy crypto" subtitle="Pay in euros with BTC Direct">
      <div className="max-w-xl space-y-4">
        {params.get("status") === "returned" && (
          <Card><CardContent className="pt-6 text-sm">
            Welcome back. Your order is in your transaction history as pending until BTC Direct completes it.
          </CardContent></Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>New purchase</CardTitle>
            <CardDescription>You'll finish payment and verification on BTC Direct's secure page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="amt">Amount (EUR)</Label>
                <Input id="amt" type="number" min={10} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Coin and payment method</Label>
              <p className="text-sm text-foreground">Bitcoin (BTC) · Credit card</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Your Bitcoin wallet address</Label>
              <Input id="wallet" className="font-mono" placeholder="bc1…" maxLength={128} value={wallet} onChange={(e) => setWallet(e.target.value)} />
              <p className="text-xs text-muted-foreground">Real (mainnet) address only. Coins are sent here.</p>
            </div>
            <Button className="w-full" onClick={buy} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-1" />}
              Continue to payment
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
