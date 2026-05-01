import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DbTransaction {
  id: string;
  user_id: string;
  type: string;
  asset: string;
  amount: number;
  usd_value: number;
  status: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setTransactions(data as DbTransaction[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = async (
    tx: Omit<DbTransaction, "id" | "user_id" | "created_at" | "metadata"> & {
      metadata?: Record<string, any>;
    },
  ) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("transactions").insert({
      ...tx,
      metadata: tx.metadata ?? {},
      user_id: user.id,
    });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { transactions, loading, refresh, addTransaction };
}
