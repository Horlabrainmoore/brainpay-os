/**
 * Mempool.js React Hook
 * High-level hook for fetching and caching mempool data
 */

import { useQuery } from '@tanstack/react-query';
import * as mempoolService from '@/services/mempool';
import type {
  AddressStats,
  FeeEstimate,
  BlockStats,
  TransactionData,
  MempoolStats,
} from '@/services/mempool';

const QUERY_KEYS = {
  address: (addr: string) => ['mempool', 'address', addr],
  addressTxs: (addr: string, from: number, to: number) => ['mempool', 'address-txs', addr, from, to],
  fees: () => ['mempool', 'fees'],
  blockHeight: () => ['mempool', 'block-height'],
  block: (hash: string) => ['mempool', 'block', hash],
  transaction: (txid: string) => ['mempool', 'tx', txid],
  mempoolStats: () => ['mempool', 'stats'],
  recentTxs: (count: number) => ['mempool', 'recent-txs', count],
};

/**
 * Hook to fetch Bitcoin address statistics
 */
export function useAddressStats(address: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.address(address || ''),
    queryFn: async () => {
      if (!address) return null;
      return mempoolService.getAddressStats(address);
    },
    enabled: !!address,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch address transactions
 */
export function useAddressTransactions(
  address: string | null,
  fromIndex: number = 0,
  toIndex: number = 24
) {
  return useQuery({
    queryKey: QUERY_KEYS.addressTxs(address || '', fromIndex, toIndex),
    queryFn: async () => {
      if (!address) return null;
      return mempoolService.getAddressTransactions(address, fromIndex, toIndex);
    },
    enabled: !!address,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch recommended fee rates
 */
export function useFeeEstimates() {
  return useQuery({
    queryKey: QUERY_KEYS.fees(),
    queryFn: () => mempoolService.getFeeEstimates(),
    staleTime: 30 * 1000, // 30 seconds (fees update frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch current block height
 */
export function useBlockHeight() {
  return useQuery({
    queryKey: QUERY_KEYS.blockHeight(),
    queryFn: () => mempoolService.getBlockHeight(),
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch block details
 */
export function useBlock(hashOrHeight: string | number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.block(String(hashOrHeight || '')),
    queryFn: async () => {
      if (!hashOrHeight) return null;
      return mempoolService.getBlock(hashOrHeight);
    },
    enabled: !!hashOrHeight,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch transaction details
 */
export function useTransaction(txid: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(txid || ''),
    queryFn: async () => {
      if (!txid) return null;
      return mempoolService.getTransaction(txid);
    },
    enabled: !!txid,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch mempool statistics
 */
export function useMempoolStats() {
  return useQuery({
    queryKey: QUERY_KEYS.mempoolStats(),
    queryFn: () => mempoolService.getMempoolStats(),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch recent mempool transactions
 */
export function useRecentMempoolTxs(count: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.recentTxs(count),
    queryFn: () => mempoolService.getMempoolRecentTxs(count),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export default {
  useAddressStats,
  useAddressTransactions,
  useFeeEstimates,
  useBlockHeight,
  useBlock,
  useTransaction,
  useMempoolStats,
  useRecentMempoolTxs,
};
