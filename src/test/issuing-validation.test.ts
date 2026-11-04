import { describe, expect, it } from "vitest";
import { validateTransferAmount } from "@/lib/issuing";

describe("validateTransferAmount", () => {
  it("accepts a valid whole-dollar amount", () => {
    expect(validateTransferAmount("50", 1000)).toEqual({ ok: true, amount: 50 });
  });

  it("accepts up to 2 decimal places", () => {
    expect(validateTransferAmount("10.25", 1000)).toEqual({ ok: true, amount: 10.25 });
    expect(validateTransferAmount("100.00", 1000)).toEqual({ ok: true, amount: 100 });
  });

  it("rejects empty and non-numeric input", () => {
    expect(validateTransferAmount("", 1000).ok).toBe(false);
    expect(validateTransferAmount("abc", 1000).ok).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    expect(validateTransferAmount("50.005", 1000).ok).toBe(false);
  });

  it("rejects negative and zero amounts", () => {
    expect(validateTransferAmount("0", 1000).ok).toBe(false);
    expect(validateTransferAmount("-5", 1000).ok).toBe(false);
  });

  it("enforces the $1 minimum", () => {
    const result = validateTransferAmount("0.50", 1000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("$1");
  });

  it("rejects amounts exceeding the available balance", () => {
    const result = validateTransferAmount("2000", 1000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Available Balance");
  });

  it("accepts an amount exactly equal to the available balance", () => {
    expect(validateTransferAmount("1000", 1000)).toEqual({ ok: true, amount: 1000 });
  });
});
