import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useBalances } from "./useBalances";

const mocks = vi.hoisted(() => ({ user: { id: "user-a" } as { id: string } | null, read: vi.fn(), rpc: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.read }) }) }), rpc: mocks.rpc,
} }));
const row = (available: number) => ({ data: { usd_available: available, usd_issuing: 10 }, error: null });
function deferred() {
  let resolve!: (value: unknown) => void;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}
beforeEach(() => { vi.resetAllMocks(); mocks.user = { id: "user-a" }; });

it("ignores stale success and error responses while preserving current error handling", async () => {
  const old = deferred();
  mocks.read.mockReturnValueOnce(old.promise).mockResolvedValueOnce(row(80));
  const { result } = renderHook(useBalances);
  await act(async () => { await result.current.refresh(); });
  await act(async () => { old.resolve({ data: null, error: { message: "stale" } }); });
  expect(result.current.balances?.usdAvailable).toBe(80);
  expect(result.current.error).toBeNull();
  mocks.read.mockResolvedValueOnce({ data: null, error: { message: "current" } });
  await act(async () => { await result.current.refresh(); });
  expect(result.current.balances).toBeNull();
  expect(result.current.error).toBe("current");
  expect(result.current.loading).toBe(false);
});

it("does not let an older success clear the latest error or loading state", async () => {
  const old = deferred(), current = deferred();
  mocks.read.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const { result } = renderHook(useBalances);
  let refresh: Promise<void>;
  act(() => { refresh = result.current.refresh(); });
  await act(async () => { old.resolve(row(100)); });
  expect(result.current.loading).toBe(true);
  expect(result.current.balances).toBeNull();
  await act(async () => { current.resolve({ data: null, error: { message: "latest" } }); await refresh; });
  expect(result.current.error).toBe("latest");
});

it("discards reads after sign-out and account switches", async () => {
  const old = deferred();
  mocks.read.mockReturnValueOnce(old.promise).mockResolvedValueOnce(row(20));
  const { result, rerender } = renderHook(useBalances);
  mocks.user = null;
  rerender();
  await act(async () => { old.resolve(row(100)); });
  expect(result.current.balances).toBeNull();
  expect(result.current.loading).toBe(false);
  mocks.user = { id: "user-b" };
  rerender();
  await waitFor(() => expect(result.current.balances?.usdAvailable).toBe(20));
});

it("forwards the caller's operation ID across retries", async () => {
  mocks.read.mockResolvedValue(row(100));
  mocks.rpc.mockResolvedValueOnce({ error: { message: "timeout" } }).mockResolvedValueOnce({ error: null });
  const { result } = renderHook(useBalances);
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    expect(await result.current.fundIssuingBalance(10, "operation-a")).toEqual({ error: "timeout" });
    expect(await result.current.fundIssuingBalance(10, "operation-a")).toEqual({ error: null });
  });
  expect(mocks.rpc.mock.calls).toEqual(Array(2).fill(["fund_issuing_balance", { p_amount: 10, p_operation_id: "operation-a" }]));
});
