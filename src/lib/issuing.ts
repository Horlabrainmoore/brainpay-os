// Validation rules for Available → Issuing USD transfers.
export const MIN_TRANSFER_USD = 1;
export const MAX_TRANSFER_USD = 1_000_000;

export interface TransferValidation {
  ok: boolean;
  error?: string;
  amount?: number;
}

export function validateTransferAmount(input: string, availableUsd: number): TransferValidation {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Enter an amount" };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Amount must be a number with up to 2 decimal places" };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) return { ok: false, error: "Enter a valid amount" };
  if (amount < MIN_TRANSFER_USD) {
    return { ok: false, error: `Minimum transfer is $${MIN_TRANSFER_USD}` };
  }
  if (amount > MAX_TRANSFER_USD) {
    return { ok: false, error: `Maximum transfer is $${MAX_TRANSFER_USD.toLocaleString()}` };
  }
  if (amount > availableUsd) {
    return { ok: false, error: "Amount exceeds your USD Available Balance" };
  }
  return { ok: true, amount };
}

export function formatUsd(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === null || n === undefined || !Number.isFinite(n as number)) return "$0.00";
  return (n as number).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
