/**
 * Bitcoin Address Validation & Utilities
 */

export interface AddressValidation {
  valid: boolean;
  kind?: string;
  reason?: string;
}

/**
 * Validate Bitcoin address and return type
 */
export function validateBtcAddress(address: string): AddressValidation {
  if (!address || typeof address !== 'string') {
    return { valid: false, reason: 'Address is required' };
  }

  const trimmed = address.trim();

  // Mainnet P2PKH (starts with 1)
  if (/^1[1-9A-HJ-NP-Z]{25,34}$/.test(trimmed)) {
    return { valid: true, kind: 'P2PKH' };
  }

  // Mainnet P2SH (starts with 3)
  if (/^3[1-9A-HJ-NP-Z]{25,34}$/.test(trimmed)) {
    return { valid: true, kind: 'P2SH' };
  }

  // Mainnet Bech32 (bc1)
  if (/^bc1[a-z0-9]{39,59}$/.test(trimmed)) {
    return { valid: true, kind: 'Bech32 (P2WPKH/P2WSH)' };
  }

  // Testnet P2PKH (starts with m or n)
  if (/^[mn][1-9A-HJ-NP-Z]{25,34}$/.test(trimmed)) {
    return { valid: true, kind: 'Testnet P2PKH' };
  }

  // Testnet P2SH (starts with 2)
  if (/^2[1-9A-HJ-NP-Z]{25,34}$/.test(trimmed)) {
    return { valid: true, kind: 'Testnet P2SH' };
  }

  // Testnet Bech32 (tb1)
  if (/^tb1[a-z0-9]{39,59}$/.test(trimmed)) {
    return { valid: true, kind: 'Testnet Bech32' };
  }

  // Signet Bech32 (tb1)
  if (/^tb1[a-z0-9]{39,59}$/.test(trimmed)) {
    return { valid: true, kind: 'Signet Bech32' };
  }

  return { valid: false, reason: 'Invalid Bitcoin address format' };
}

/**
 * Check if address is on testnet
 */
export function isTestnetAddress(address: string): boolean {
  return /^(?:[mn2]|tb1)/.test(address);
}

/**
 * Get network from address
 */
export function getNetworkFromAddress(
  address: string
): 'mainnet' | 'testnet' | 'signet' | null {
  if (isTestnetAddress(address)) {
    return 'testnet';
  }
  if (/^bc1/.test(address)) {
    return 'mainnet';
  }
  if (/^[13]/.test(address)) {
    return 'mainnet';
  }
  return null;
}

/**
 * Truncate address for display
 */
export function truncateAddress(
  address: string,
  startChars: number = 8,
  endChars: number = 6
): string {
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format address with checksum (if applicable)
 */
export function formatBtcAddress(address: string): string {
  return address.trim().toLowerCase();
}

export default {
  validateBtcAddress,
  isTestnetAddress,
  getNetworkFromAddress,
  truncateAddress,
  formatBtcAddress,
};
