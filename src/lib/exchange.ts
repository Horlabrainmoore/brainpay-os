import { supabase } from "@/integrations/supabase/client";

/**
 * Typed client for the Public REST API (2018-09-25).
 * Every call goes through the `exchange-proxy` edge function, which holds the
 * API key/secret and HMAC-SHA256 signs TRADE / USER_DATA requests.
 */

export type Params = Record<string, string | number | boolean | null | undefined>;

export interface ProxyRequest {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  params?: Params;
  /** SIGNED endpoint (TRADE / USER_DATA): adds timestamp, recvWindow and signature. */
  signed?: boolean;
  /** MARKET_DATA / USER_STREAM: sends X-BH-APIKEY without a signature. */
  apiKeyOnly?: boolean;
  recvWindow?: number;
}

export class ExchangeError extends Error {
  constructor(message: string, public status?: number, public details?: string) {
    super(message);
    this.name = "ExchangeError";
  }
}

export async function exchangeCall<T>(req: ProxyRequest): Promise<T> {
  const { data, error } = await supabase.functions.invoke("exchange-proxy", { body: req });
  if (error) {
    let message = "Exchange request failed";
    let details = error.message;
    const ctx = (error as unknown as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        const raw = await ctx.text();
        details = raw;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) message = parsed.error;
          if (parsed?.details) details = parsed.details;
          if (parsed?.status) {
            throw new ExchangeError(message, parsed.status, details);
          }
        } catch (parseErr) {
          if (parseErr instanceof ExchangeError) throw parseErr;
        }
      } catch (readErr) {
        if (readErr instanceof ExchangeError) throw readErr;
      }
    }
    throw new ExchangeError(message, undefined, details);
  }
  if (data?.error) throw new ExchangeError(data.error, data.status, data.details);
  return data.data as T;
}

/* ---------- General ---------- */
export const ping = () => exchangeCall<Record<string, never>>({ path: "/openapi/v1/ping" });
export const serverTime = () => exchangeCall<{ serverTime: number }>({ path: "/openapi/v1/time" });

export interface SymbolFilter { filterType: string; [k: string]: unknown }
export interface ExchangeSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: string;
  quotePrecision: string;
  icebergAllowed: boolean;
  filters: SymbolFilter[];
}
export interface ExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: { rateLimitType: string; interval: string; limit: number }[];
  brokerFilters: SymbolFilter[];
  symbols: ExchangeSymbol[];
}
export const exchangeInfo = () => exchangeCall<ExchangeInfo>({ path: "/openapi/v1/exchange" });

/* ---------- Market data ---------- */
export interface Depth { bids: [string, string][]; asks: [string, string][] }
export const depth = (symbol: string, limit = 20) =>
  exchangeCall<Depth>({ path: "/openapi/quote/v1/depth", params: { symbol, limit } });

export interface RecentTrade { price: string; qty: string; time: number; isBuyerMaker: boolean }
export const recentTrades = (symbol: string, limit = 50) =>
  exchangeCall<RecentTrade[]>({ path: "/openapi/quote/v1/trades", params: { symbol, limit } });

export type Kline = [number, string, string, string, string, string, number, string, number];
export const klines = (symbol: string, interval = "1h", limit = 100) =>
  exchangeCall<Kline[]>({ path: "/openapi/quote/v1/klines", params: { symbol, interval, limit } });

export interface Ticker24h {
  time: number; symbol: string; lastPrice: string; openPrice: string;
  highPrice: string; lowPrice: string; volume: string;
  bestBidPrice?: string; bestAskPrice?: string;
}
export const ticker24h = (symbol?: string) =>
  exchangeCall<Ticker24h | Ticker24h[]>({ path: "/openapi/quote/v1/ticker/24hr", params: { symbol } });

export const priceTicker = (symbol?: string) =>
  exchangeCall<{ symbol?: string; price: string } | { symbol: string; price: string }[]>({
    path: "/openapi/quote/v1/ticker/price",
    params: { symbol },
  });

export interface BookTicker {
  symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string;
}
export const bookTicker = (symbol?: string) =>
  exchangeCall<BookTicker | BookTicker[]>({ path: "/openapi/quote/v1/ticker/bookTicker", params: { symbol } });

/* ---------- Account (SIGNED) ---------- */
export interface AccountInfo {
  canTrade: boolean; canWithdraw: boolean; canDeposit: boolean; updateTime: number;
  balances: { asset: string; free: string; locked: string }[];
}
export const accountInfo = () =>
  exchangeCall<AccountInfo>({ path: "/openapi/v1/account", signed: true });

export interface Order {
  symbol: string; orderId: number; clientOrderId: string; price: string; origQty: string;
  executedQty: string; cummulativeQuoteQty: string; avgPrice: string; status: string;
  timeInForce: string; type: string; side: string; stopPrice: string; icebergQty: string;
  time: number; updateTime: number; isWorking: boolean;
}
export const openOrders = (symbol?: string, limit = 100) =>
  exchangeCall<Order[]>({ path: "/openapi/v1/openOrders", signed: true, params: { symbol, limit } });

export const historyOrders = (symbol?: string, limit = 100) =>
  exchangeCall<Order[]>({ path: "/openapi/v1/historyOrders", signed: true, params: { symbol, limit } });

export interface MyTrade {
  symbol: string; id: number; orderId: number; matchOrderId: number; price: string; qty: string;
  commission: string; commissionAsset: string; time: number; isBuyer: boolean; isMaker: boolean;
  feeTokenId: string; fee: string;
}
export const myTrades = (limit = 100) =>
  exchangeCall<MyTrade[]>({ path: "/openapi/v1/myTrades", signed: true, params: { limit } });

export interface NewOrderParams {
  symbol: string;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET" | "LIMIT_MAKER";
  quantity: number | string;
  price?: number | string;
  timeInForce?: "GTC" | "IOC" | "FOK";
  newClientOrderId?: string;
}
export const newOrder = (p: NewOrderParams, test = false) =>
  exchangeCall<{ orderId?: number; clientOrderId?: string }>({
    path: test ? "/openapi/v1/order/test" : "/openapi/v1/order",
    method: "POST",
    signed: true,
    params: { ...p },
  });

export const cancelOrder = (orderId: number) =>
  exchangeCall<{ symbol: string; orderId: number; status: string; clientOrderId: string }>({
    path: "/openapi/v1/order",
    method: "DELETE",
    signed: true,
    params: { orderId },
  });
