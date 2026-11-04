import { describe, expect, it } from "vitest";
import { validateProjectId } from "@/lib/walletconnect";

describe("validateProjectId", () => {
  const VALID = "3f26f51234567890abcdef1234567890";

  it("accepts a 32-character hexadecimal project ID", () => {
    expect(validateProjectId(VALID)).toEqual({ ok: true });
  });

  it("accepts uppercase hex and trims whitespace", () => {
    expect(validateProjectId(`  ${VALID.toUpperCase()} `)).toEqual({ ok: true });
  });

  it("rejects an empty ID", () => {
    expect(validateProjectId("").ok).toBe(false);
    expect(validateProjectId("   ").ok).toBe(false);
  });

  it("rejects IDs that are too short or too long", () => {
    expect(validateProjectId("abc123").ok).toBe(false);
    expect(validateProjectId(`${VALID}ff`).ok).toBe(false);
  });

  it("rejects non-hexadecimal characters", () => {
    expect(validateProjectId("z".repeat(32)).ok).toBe(false);
  });
});
