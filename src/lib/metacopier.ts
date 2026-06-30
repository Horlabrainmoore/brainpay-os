import { supabase } from "@/integrations/supabase/client";

export interface MetaCopierAccount {
  id: string;
  name?: string;
  login?: string | number;
  broker?: string;
  brokerType?: string;
  platform?: string;
  type?: string;
  status?: string;
  currency?: string;
  balance?: number;
  equity?: number;
  [key: string]: unknown;
}

export interface MetaCopierPosition {
  id?: string;
  ticket?: string | number;
  symbol?: string;
  type?: string;
  side?: string;
  lots?: number;
  volume?: number;
  openPrice?: number;
  closePrice?: number;
  currentPrice?: number;
  profit?: number;
  swap?: number;
  commission?: number;
  openTime?: string;
  closeTime?: string;
  [key: string]: unknown;
}

export interface MetaCopierPerformance {
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
  winRate?: number;
  profitFactor?: number;
  totalProfit?: number;
  totalLoss?: number;
  averageWin?: number;
  averageLoss?: number;
  maxDrawdown?: number;
  sharpeRatio?: number;
  [key: string]: unknown;
}

interface ProxyResponse<T> {
  status: number;
  ok: boolean;
  data: T;
}

async function call<T>(
  path: string,
  opts: { method?: string; query?: Record<string, string | number | undefined>; body?: unknown } = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<ProxyResponse<T>>("metacopier-proxy", {
    body: { path, method: opts.method ?? "GET", query: opts.query, body: opts.body },
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Empty response from MetaCopier proxy");
  if (!data.ok) {
    const detail =
      typeof data.data === "string"
        ? data.data
        : (data.data as { message?: string; error?: string } | null)?.message ??
          (data.data as { error?: string } | null)?.error ??
          JSON.stringify(data.data);
    throw new Error(`MetaCopier API ${data.status}: ${detail}`);
  }
  return data.data;
}

function arr<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object") {
    const v = x as Record<string, unknown>;
    for (const k of ["content", "data", "items", "results"]) {
      if (Array.isArray(v[k])) return v[k] as T[];
    }
  }
  return [];
}

export const metacopier = {
  async listAccounts(): Promise<MetaCopierAccount[]> {
    const raw = await call<unknown>("/rest/api/v1/accounts");
    return arr<MetaCopierAccount>(raw);
  },
  async getAccount(accountId: string): Promise<MetaCopierAccount> {
    return call<MetaCopierAccount>(`/rest/api/v1/accounts/${encodeURIComponent(accountId)}`);
  },
  async getPositions(accountId: string): Promise<MetaCopierPosition[]> {
    const raw = await call<unknown>(`/rest/api/v1/accounts/${encodeURIComponent(accountId)}/positions`);
    return arr<MetaCopierPosition>(raw);
  },
  async getHistoryPositions(
    accountId: string,
    query?: { from?: string; to?: string; size?: number },
  ): Promise<MetaCopierPosition[]> {
    const raw = await call<unknown>(
      `/rest/api/v1/accounts/${encodeURIComponent(accountId)}/history/positions`,
      { query },
    );
    return arr<MetaCopierPosition>(raw);
  },
  async getPerformanceMetrics(accountId: string): Promise<MetaCopierPerformance> {
    return call<MetaCopierPerformance>(
      `/rest/api/v1/accounts/${encodeURIComponent(accountId)}/performanceMetrics`,
    );
  },
  async getInformation(accountId: string): Promise<Record<string, unknown>> {
    return call(`/rest/api/v1/accounts/${encodeURIComponent(accountId)}/information`);
  },
};
