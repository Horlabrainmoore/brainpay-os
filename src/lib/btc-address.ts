/**
 * Lightweight BTC mainnet address validator.
 * Accepts: P2PKH (1...), P2SH (3...), Bech32 P2WPKH/P2WSH (bc1q...), Taproot (bc1p...).
 * Not a full checksum verifier — pairs with a server lookup that will reject bad addresses.
 */
const LEGACY = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
const BECH32 = /^bc1[qp][023456789acdefghjklmnpqrstuvwxyz]{38,87}$/;

export type BtcAddressKind = "p2pkh" | "p2sh" | "bech32" | "taproot" | null;

export function classifyBtcAddress(addr: string): BtcAddressKind {
  const a = addr.trim();
  if (!a) return null;
  if (/^1/.test(a) && LEGACY.test(a)) return "p2pkh";
  if (/^3/.test(a) && LEGACY.test(a)) return "p2sh";
  if (BECH32.test(a.toLowerCase())) return a.toLowerCase().startsWith("bc1p") ? "taproot" : "bech32";
  return null;
}

export function validateBtcAddress(addr: string): { valid: boolean; reason?: string; kind: BtcAddressKind } {
  const a = addr.trim();
  if (!a) return { valid: false, reason: "Address is required.", kind: null };
  if (/\s/.test(a)) return { valid: false, reason: "Address cannot contain spaces.", kind: null };
  if (a.length < 26) return { valid: false, reason: "Address is too short.", kind: null };
  if (a.length > 90) return { valid: false, reason: "Address is too long.", kind: null };
  const kind = classifyBtcAddress(a);
  if (!kind) {
    return {
      valid: false,
      reason: "Not a recognized mainnet BTC address. Expected formats: 1…, 3…, bc1q…, bc1p…",
      kind: null,
    };
  }
  return { valid: true, kind };
}
