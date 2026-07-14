import { useQuery } from "@tanstack/react-query";
import { getTransaction, getBlockHeight } from "@/services/mempool";

export interface TxStatus {
  txid: string;
  confirmed: boolean;
  blockHeight?: number;
  blockTime?: number;
  confirmations: number;
}

/**
 * Poll mempool for a transaction's confirmation status.
 * Refetches every 20s while unconfirmed, every 2 minutes after confirmation.
 */
export function useTxStatus(txid: string | null | undefined) {
  return useQuery<TxStatus | null>({
    queryKey: ["tx-status", txid],
    enabled: !!txid,
    queryFn: async () => {
      if (!txid) return null;
      const [tx, tip] = await Promise.all([getTransaction(txid), getBlockHeight()]);
      const confirmations =
        tx.status.confirmed && tx.status.block_height ? tip - tx.status.block_height + 1 : 0;
      return {
        txid: tx.txid,
        confirmed: tx.status.confirmed,
        blockHeight: tx.status.block_height,
        blockTime: tx.status.block_time,
        confirmations,
      };
    },
    refetchInterval: (query) => {
      const data = query.state.data as TxStatus | null | undefined;
      if (!data) return 20_000;
      return data.confirmed ? 120_000 : 20_000;
    },
    staleTime: 10_000,
  });
}
