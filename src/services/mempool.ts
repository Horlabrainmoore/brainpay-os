import mempoolJS from "@mempool/mempool.js";

const client = mempoolJS({ hostname: "mempool.space" });

export type AddressStats = Awaited<ReturnType<typeof client.bitcoin.addresses.getAddress>>;
export type FeeEstimate = Awaited<ReturnType<typeof client.bitcoin.fees.getFeesRecommended>>;
export type BlockStats = Awaited<ReturnType<typeof client.bitcoin.blocks.getBlock>>;
export type TransactionData = Awaited<ReturnType<typeof client.bitcoin.transactions.getTx>>;
export type MempoolStats = Awaited<ReturnType<typeof client.bitcoin.mempool.getMempoolInfo>>;

export async function getAddressUtxos(address: string) {
  const { bitcoin } = client;
  return bitcoin.addresses.getAddressTxsUtxo({ address });
}

export async function getBlockHeight() {
  const { bitcoin } = client;
  return bitcoin.blocks.getBlocksTipHeight();
}

export async function getTransaction(txid: string) {
  const { bitcoin } = client;
  return bitcoin.transactions.getTx({ txid });
}

export const getAddressStats = (address: string) => client.bitcoin.addresses.getAddress({ address });
export const getAddressTransactions = (address: string, from = 0, to = 24) =>
  client.bitcoin.addresses.getAddressTxs({ address, start_index: from, end_index: to });
export const getFeeEstimates = () => client.bitcoin.fees.getFeesRecommended();
export const getBlock = (hashOrHeight: string | number) =>
  client.bitcoin.blocks.getBlock({ hash: String(hashOrHeight) });
export const getMempoolStats = () => client.bitcoin.mempool.getMempoolInfo();
export const getMempoolRecentTxs = (count = 10) =>
  client.bitcoin.mempool.getMempoolTxids().then((txids) => Promise.all(txids.slice(0, count).map(getTransaction)));

export function validateBitcoinAddress(address: string) {
  const value = address.trim();
  const valid = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^(bc1|tb1)[ac-hj-np-z02-9]{11,87}$/i.test(value);
  return { valid, error: valid ? undefined : "Enter a valid Bitcoin mainnet or testnet address." };
}
