import { afterEach, describe, expect, it, vi } from "vitest";
import { formatUsd } from "./utils";

afterEach(() => vi.restoreAllMocks());

describe("formatUsd", () => {
  it.each([[0, "$0.00"], [1, "$1.00"], [1.2, "$1.20"], [1.236, "$1.24"], [1234567.89, "$1,234,567.89"]])("formats %s with two decimal places", (value, expected) => {
    // Pin the host locale while still exercising the real Intl formatter.
    const toLocaleString = Number.prototype.toLocaleString;
    vi.spyOn(Number.prototype, "toLocaleString").mockImplementation(function (_locale, options) {
      return toLocaleString.call(this, "en-US", options);
    });
    expect(formatUsd(value)).toBe(expected);
  });

  it("uses the runtime locale rather than forcing US grouping", () => {
    const formatter = vi.spyOn(Number.prototype, "toLocaleString").mockReturnValue("1.234,50");
    expect(formatUsd(1234.5)).toBe("$1.234,50");
    expect(formatter).toHaveBeenCalledWith(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  });
});
