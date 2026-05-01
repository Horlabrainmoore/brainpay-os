import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface DbTrade {
  id: string;
  user_id: string;
  symbol: string;
  side: "buy" | "sell";
  amount: number;
  entry_price: number;
  exit_price: number | null;
  pnl: number;
  status: string;
  confidence: number | null;
  signal_id: string | null;
  created_at: string;
}

export function useTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<DbTrade[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error && data) setTrades(data as DbTrade[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTrade = async (
    trade: Omit<DbTrade, "id" | "user_id" | "created_at" | "exit_price" | "pnl" | "status"> & {
      pnl?: number;
      status?: string;
    },
  ) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("trades").insert({
      ...trade,
      pnl: trade.pnl ?? 0,
      status: trade.status ?? "open",
      user_id: user.id,
    });
    if (!error) await refresh();
    return { error: error?.message ?? null };
  };

  return { trades, loading, refresh, addTrade };
}
