// WalletConnect project ID validation (32 hex characters).
export const PROJECT_ID_PATTERN = /^[0-9a-f]{32}$/i;

export interface ProjectIdValidation {
  ok: boolean;
  error?: string;
}

export function validateProjectId(raw: string): ProjectIdValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter your WalletConnect project ID" };
  if (!PROJECT_ID_PATTERN.test(trimmed)) {
    return { ok: false, error: "Project IDs are 32 hexadecimal characters (a-f, 0-9)" };
  }
  return { ok: true };
}
