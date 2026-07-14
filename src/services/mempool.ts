/**
 * Mempool.js Service
 * Central service for all Mempool API interactions
 */

import mempoolJS from '@mempool/mempool.js';

const MEMPOOL_API_BASE = import.meta.env.VITE_MEMPOOL_API_BASE || 'https://mempool.space';

interface MempoolConfig {
  protocol?: 'http' | 'https';
  hostname?: string;
  network?: 'mainnet' | 'testnet' | 'testnet4' | 'signet' | 'liquid' | 'liquidtestnet';
}

// Initialize Mempool client
const initMempoolClient = (config: MempoolConfig = {}) => {
  return mempoolJS({
    protocol: config.protocol || 'https',
    hostname: config.hostname || 'mempool.space',
    network: config.network || 'mainnet',
  });
};

export interface AddressStats {
  address: string;
  balanceSats: number;
  balanceBtc: number;
  totalTxCount: number;
  chainTxCount: number;
  mempoolTxCount: number;
  unconfirmedBalanceSats: number;
  funded: number;
  spent: number;
}

export interface FeeEstimate {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export interface BlockStats {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
  size: number;
  weight: number;
  difficulty: number;
  feeRange: [number, number, number, number, number];
}

export interface TransactionData {
  txid: string;
  fee: number;
  size: number;
  weight: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_time?: number;
    block_hash?: string;
  };
  vin: Array<{ txid: string; vout: number }>;
  vout: Array<{ value: number; scriptpubkey: string }>;
}

export interface MempoolStats {
  vsize: number;
  mempool_count: number;
  total_fee_sat: number;
  avg_fee_rate: number;
}

/**
 * Get Bitcoin address statistics
 */
export async function getAddressStats(address: string): Promise<AddressStats> {
  try {
    const { bitcoin } = initMempoolClient();
    const data = await bitcoin.addresses.getAddress({ address });

    const chainFunded = data.chain_stats.funded_txo_sum;
    const chainSpent = data.chain_stats.spent_txo_sum;
    const mempoolFunded = data.mempool_stats.funded_txo_sum;
    const mempoolSpent = data.mempool_stats.spent_txo_sum;

    const totalFunded = chainFunded + mempoolFunded;
    const totalSpent = chainSpent + mempoolSpent;
    const balanceSats = totalFunded - totalSpent;

    return {
      address,
      balanceSats,
      balanceBtc: balanceSats / 1e8,
      totalTxCount: data.chain_stats.tx_count + data.mempool_stats.tx_count,
      chainTxCount: data.chain_stats.tx_count,
      mempoolTxCount: data.mempool_stats.tx_count,
      unconfirmedBalanceSats: mempoolFunded - mempoolSpent,
      funded: totalFunded,
      spent: totalSpent,
    };
  } catch (error) {
    throw new Error(`Failed to fetch address stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get address transactions with pagination
 */
export async function getAddressTransactions(
  address: string,
  fromIndex: number = 0,
  toIndex: number = 24
): Promise<TransactionData[]> {
  try {
    const { bitcoin } = initMempoolClient();
    const txs = await bitcoin.addresses.getAddressTxs({ address });
    return (txs as unknown as TransactionData[]).slice(fromIndex, toIndex);
  } catch (error) {
    throw new Error(`Failed to fetch address transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get address UTXO list
 */
export async function getAddressUtxos(address: string) {
  try {
    const { bitcoin } = initMempoolClient();
    const utxos = await bitcoin.addresses.getAddressTxsUtxo({ address });
    return utxos;
  } catch (error) {
    throw new Error(`Failed to fetch address UTXOs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get recommended fee rates
 */
export async function getFeeEstimates(): Promise<FeeEstimate> {
  try {
    const { bitcoin } = initMempoolClient();
    const fees = await bitcoin.fees.getFeesRecommended();
    return {
      fastestFee: fees.fastestFee,
      halfHourFee: fees.halfHourFee,
      hourFee: fees.hourFee,
      economyFee: (fees as any).economyFee ?? fees.minimumFee,
      minimumFee: fees.minimumFee,
    };
  } catch (error) {
    throw new Error(`Failed to fetch fee estimates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get current block height
 */
export async function getBlockHeight(): Promise<number> {
  try {
    const { bitcoin } = initMempoolClient();
    const height = await bitcoin.blocks.getBlocksTipHeight();
    return Number(height);
  } catch (error) {
    throw new Error(`Failed to fetch block height: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get block by height or hash
 */
export async function getBlock(hashOrHeight: string | number): Promise<BlockStats> {
  try {
    const { bitcoin } = initMempoolClient();
    const block = await bitcoin.blocks.getBlock({ hash: String(hashOrHeight) });
    return {
      height: block.height,
      hash: block.id,
      timestamp: block.timestamp,
      txCount: block.tx_count,
      size: block.size,
      weight: block.weight,
      difficulty: block.difficulty,
      feeRange: (block as any).fee_range || (block as any).extras?.feeRange || [0, 0, 0, 0, 0],
    };
  } catch (error) {
    throw new Error(`Failed to fetch block: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txid: string): Promise<TransactionData> {
  try {
    const { bitcoin } = initMempoolClient();
    const tx = await bitcoin.transactions.getTx({ txid });
    return {
      txid: tx.txid,
      fee: tx.fee,
      size: tx.size,
      weight: tx.weight,
      status: {
        confirmed: tx.status.confirmed,
        block_height: tx.status.block_height,
        block_time: tx.status.block_time,
        block_hash: tx.status.block_hash,
      },
      vin: tx.vin,
      vout: tx.vout,
    };
  } catch (error) {
    throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get mempool stats
 */
export async function getMempoolStats(): Promise<MempoolStats> {
  try {
    const { bitcoin } = initMempoolClient();
    const mempool = (await bitcoin.mempool.getMempool()) as unknown as {
      vsize: number;
      count: number;
      total_fee_sat: number;
    };
    return {
      vsize: mempool.vsize,
      mempool_count: mempool.count,
      total_fee_sat: mempool.total_fee_sat,
      avg_fee_rate: mempool.total_fee_sat / mempool.vsize, // sat/vB
    };
  } catch (error) {
    throw new Error(`Failed to fetch mempool stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get recent transactions in mempool
 */
export async function getMempoolRecentTxs(count: number = 10): Promise<TransactionData[]> {
  try {
    const { bitcoin } = initMempoolClient();
    const txs = await bitcoin.mempool.getMempoolRecent();
    return (txs as unknown as TransactionData[]).slice(0, count);
  } catch (error) {
    throw new Error(`Failed to fetch mempool transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate Bitcoin address format
 */
export function validateBitcoinAddress(address: string): { valid: boolean; type?: string; error?: string } {
  // P2P (legacy)
  if (/^1[1-9A-HJ-NP-Z]{25,34}$/.test(address)) {
    return { valid: true, type: 'P2PKH' };
  }
  // P2SH (multi-sig)
  if (/^3[1-9A-HJ-NP-Z]{25,34}$/.test(address)) {
    return { valid: true, type: 'P2SH' };
  }
  // Bech32 (SegWit)
  if (/^bc1[a-z0-9]{39,59}$/.test(address)) {
    return { valid: true, type: 'Bech32' };
  }
  // Testnet Bech32
  if (/^tb1[a-z0-9]{39,59}$/.test(address)) {
    return { valid: true, type: 'Testnet Bech32' };
  }

  return { valid: false, error: 'Invalid Bitcoin address format' };
}

export default {
  getAddressStats,
  getAddressTransactions,
  getAddressUtxos,
  getFeeEstimates,
  getBlockHeight,
  getBlock,
  getTransaction,
  getMempoolStats,
  getMempoolRecentTxs,
  validateBitcoinAddress,
};
