import { useEffect, useState, useCallback, useRef } from "react";
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

  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const generation = ++requestGeneration.current;
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
    if (generation !== requestGeneration.current) return;
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
    const generation = requestGeneration;
    refresh();
    return () => { ++generation.current; };
  }, [refresh]);

  const fundIssuingBalance = async (amount: number, operationId: string) => {
    const { error } = await supabase.rpc("fund_issuing_balance", { p_amount: amount, p_operation_id: operationId });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { balances, loading, error, refresh, fundIssuingBalance };
}
