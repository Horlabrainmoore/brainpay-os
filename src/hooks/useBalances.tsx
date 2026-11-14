import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UsdBalances {
  usdAvailable: number;
  usdIssuing: number;
}

export function useBalances() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<UsdBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalances(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_balances")
      .select("usd_available, usd_issuing")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      setBalances(null);
      setError(error.message);
    } else {
      setError(null);
      setBalances({
        usdAvailable: Number(data?.usd_available ?? 0),
        usdIssuing: Number(data?.usd_issuing ?? 0),
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fundIssuingBalance = async (amount: number) => {
    const { error } = await supabase.rpc("fund_issuing_balance", { p_amount: amount });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { balances, loading, error, refresh, fundIssuingBalance };
}
