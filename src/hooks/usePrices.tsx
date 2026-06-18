import { useEffect, useRef, useState } from "react";

// Map our internal symbols to Binance stream symbols
const STREAM_MAP: Record<string, string> = {
  BTC: "btcusdt",
  ETH: "ethusdt",
  SOL: "solusdt",
};

export interface PriceData {
  price: number;
  change24h: number;
  updatedAt: number;
}

export type PriceMap = Record<string, PriceData>;

/**
 * Connects to Binance public WebSocket for live ticker data.
 * USDC is treated as $1.00 (stablecoin).
 */
export function usePrices(symbols: string[] = ["BTC", "ETH", "SOL"]) {
  const [prices, setPrices] = useState<PriceMap>(() => ({
    USDC: { price: 1, change24h: 0, updatedAt: Date.now() },
  }));
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const streams = symbols
      .map((s) => STREAM_MAP[s])
      .filter(Boolean)
      .map((s) => `${s}@ticker`)
      .join("/");
    if (!streams) return;

    let active = true;

    const connect = () => {
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (active) setConnected(true);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          const data = msg.data;
          if (!data || !data.s) return;
          // Reverse-lookup our internal symbol
          const internal = Object.entries(STREAM_MAP).find(
            ([, stream]) => stream.toUpperCase() === data.s,
          )?.[0];
          if (!internal) return;
          setPrices((prev) => ({
            ...prev,
            [internal]: {
              price: parseFloat(data.c),
              change24h: parseFloat(data.P),
              updatedAt: Date.now(),
            },
          }));
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        if (!active) return;
        setConnected(false);
        // Reconnect after 3s
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  return { prices, connected };
}
