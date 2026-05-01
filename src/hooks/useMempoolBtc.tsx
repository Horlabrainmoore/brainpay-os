import { useEffect, useState } from "react";
import mempoolJS from "@mempool/mempool.js";

export interface BtcAddressStats {
  balanceSats: number;
  balanceBtc: number;
  txCount: number;
  unconfirmedSats: number;
}

const SAMPLE_BTC_ADDRESS = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"; // demo

/**
 * Fetches on-chain BTC stats for an address using mempool.space API.
 * Returns null while loading.
 */
export function useMempoolBtc(address?: string) {
  const [stats, setStats] = useState<BtcAddressStats | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const target = address || SAMPLE_BTC_ADDRESS;

    const run = async () => {
      try {
        const { bitcoin } = mempoolJS({ hostname: "mempool.space" });
        const [addr, fees] = await Promise.all([
          bitcoin.addresses.getAddress({ address: target }),
          bitcoin.fees.getFeesRecommended(),
        ]);
        if (cancelled) return;
        const funded = addr.chain_stats.funded_txo_sum + addr.mempool_stats.funded_txo_sum;
        const spent = addr.chain_stats.spent_txo_sum + addr.mempool_stats.spent_txo_sum;
        const balanceSats = funded - spent;
        setStats({
          balanceSats,
          balanceBtc: balanceSats / 1e8,
          txCount: addr.chain_stats.tx_count + addr.mempool_stats.tx_count,
          unconfirmedSats:
            addr.mempool_stats.funded_txo_sum - addr.mempool_stats.spent_txo_sum,
        });
        setFeeEstimate(fees.halfHourFee);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Mempool fetch failed");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return { stats, feeEstimate, error };
}
