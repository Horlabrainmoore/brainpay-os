import { useEffect, useRef, useState } from "react";
import mempoolJS from "@mempool/mempool.js";

export interface BlockSummary {
  id: string;
  height: number;
  timestamp: number;
  tx_count: number;
  size: number;
  weight: number;
  extras?: {
    pool?: { name: string; slug?: string; id?: number };
    feeRange?: number[];
    medianFee?: number;
    totalFees?: number;
    reward?: number;
  };
}

/**
 * Live BTC blocks feed.
 * - Initial fetch via bitcoin.blocks.getBlocks()
 * - Websocket subscription for new blocks
 * - 30s polling fallback if WS disconnects
 */
export function useLiveBlocks(limit = 15) {
  const [blocks, setBlocks] = useState<BlockSummary[]>([]);
  const [status, setStatus] = useState<"connecting" | "live" | "polling" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { bitcoin } = mempoolJS({ hostname: "mempool.space" });

    const fetchInitial = async () => {
      try {
        const data = await bitcoin.blocks.getBlocks({});
        if (cancelled) return;
        setBlocks((data as BlockSummary[]).slice(0, limit));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "fetch failed");
      }
    };

    const startPolling = () => {
      if (pollRef.current) return;
      setStatus("polling");
      pollRef.current = setInterval(fetchInitial, 30_000);
    };
    const stopPolling = () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const connectWs = () => {
      try {
        const ws = new WebSocket("wss://mempool.space/api/v1/ws");
        wsRef.current = ws;
        ws.onopen = () => {
          setStatus("live");
          stopPolling();
          ws.send(JSON.stringify({ action: "want", data: ["blocks"] }));
        };
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            const newBlock = msg.block as BlockSummary | undefined;
            if (newBlock && newBlock.height) {
              setBlocks((prev) => {
                if (prev.some((b) => b.id === newBlock.id)) return prev;
                return [newBlock, ...prev].slice(0, limit);
              });
            }
          } catch {
            /* ignore */
          }
        };
        ws.onerror = () => {
          setStatus("error");
        };
        ws.onclose = () => {
          if (cancelled) return;
          startPolling();
          setTimeout(connectWs, 5_000);
        };
      } catch {
        startPolling();
      }
    };

    fetchInitial();
    connectWs();

    return () => {
      cancelled = true;
      stopPolling();
      wsRef.current?.close();
    };
  }, [limit]);

  return { blocks, status, error };
}
