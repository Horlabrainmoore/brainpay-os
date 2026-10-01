import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, Loader2 } from "lucide-react";

const COINS = ["BTC", "ETH", "USDC", "SOL", "LTC"];
const METHODS = [
  { id: "creditCard", label: "Credit card" },
  { id: "applePay", label: "Apple Pay" },
  { id: "googlePay", label: "Google Pay" },
  { id: "iDeal", label: "iDEAL" },
  { id: "bancontact", label: "Bancontact" },
  { id: "sofort", label: "Sofort" },
];

const schema = z.object({
  amount: z.number().min(10, "Minimum €10").max(100000),
  wallet: z.string().trim().min(10, "Enter a valid wallet address").max(128),
});

export default function BuyCryptoPage() {
  const [params] = useSearchParams();
  const [coin, setCoin] = useState("BTC");
  const [method, setMethod] = useState("creditCard");
  const [amount, setAmount] = useState("50");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);

  async function buy() {
    const v = schema.safeParse({ amount: Number(amount), wallet });
    if (!v.success) return toast.error(v.error.errors[0].message);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("btcdirect-checkout", {
        body: {
          baseCurrency: coin, quoteCurrency: "EUR", paymentMethod: method,
          quoteCurrencyAmount: v.data.amount, walletAddress: v.data.wallet,
          returnUrl: `${window.location.origin}/buy?status=returned`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.details ? `${data.error}: ${data.details}` : data.error);
      window.location.href = data.data.checkoutUrl;
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Coin</Label>
                <Select value={coin} onValueChange={setCoin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{COINS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amt">Amount (EUR)</Label>
                <Input id="amt" type="number" min={10} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wallet">Your {coin} wallet address</Label>
              <Input id="wallet" className="font-mono" placeholder={coin === "BTC" ? "bc1…" : "0x…"} value={wallet} onChange={(e) => setWallet(e.target.value)} />
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
