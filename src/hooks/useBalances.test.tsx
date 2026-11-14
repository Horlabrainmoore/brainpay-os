import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBalances } from "./useBalances";

const mocks = vi.hoisted(() => ({
  auth: { user: { id: "user-1" } as { id: string } | null },
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), rpc: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: mocks }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.user = { id: "user-1" };
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.maybeSingle.mockResolvedValue({ data: { usd_available: "100.50", usd_issuing: "20.25" }, error: null });
  mocks.rpc.mockResolvedValue({ error: null });
});
afterEach(cleanup);

async function loaded() {
  const hook = renderHook(() => useBalances());
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe("useBalances", () => {
  it("loads only the current user's balances and converts database numerics", async () => {
    const { result } = renderHook(() => useBalances());
    expect(result.current.loading).toBe(true);
    expect(result.current.balances).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.from).toHaveBeenCalledWith("user_balances");
    expect(mocks.select).toHaveBeenCalledWith("usd_available, usd_issuing");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result.current.balances).toEqual({ usdAvailable: 100.5, usdIssuing: 20.25 });
    expect(result.current.error).toBeNull();
  });

  it.each([null, { usd_available: null, usd_issuing: null }, { usd_available: 0, usd_issuing: 0 }])("defaults missing or zero balances to zero: %j", async (data) => {
    mocks.maybeSingle.mockResolvedValue({ data, error: null });
    const { result } = await loaded();
    expect(result.current.balances).toEqual({ usdAvailable: 0, usdIssuing: 0 });
    expect(result.current.error).toBeNull();
  });

  it("does not query when signed out and loads when a user signs in", async () => {
    mocks.auth.user = null;
    const { result, rerender } = await loaded();
    expect(result.current.balances).toBeNull();
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.auth.user = { id: "user-2" };
    rerender();
    await waitFor(() => expect(result.current.balances?.usdAvailable).toBe(100.5));
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "user-2");
  });

  it("clears balances on sign out without another database request", async () => {
    const { result, rerender } = await loaded();
    mocks.auth.user = null;
    rerender();
    await waitFor(() => expect(result.current.balances).toBeNull());
    expect(result.current.loading).toBe(false);
    expect(mocks.from).toHaveBeenCalledTimes(1);
  });

  it("clears stale balances after a read error and recovers on refresh", async () => {
    const { result } = await loaded();
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: { message: "Read denied" } });
    await act(async () => { await result.current.refresh(); });
    expect(result.current.balances).toBeNull();
    expect(result.current.error).toBe("Read denied");
    expect(result.current.loading).toBe(false);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.error).toBeNull();
    expect(result.current.balances?.usdAvailable).toBe(100.5);
  });

  it("refreshes balances after a successful transfer", async () => {
    const { result } = await loaded();
    mocks.maybeSingle.mockResolvedValueOnce({ data: { usd_available: 90.25, usd_issuing: 30.5 }, error: null });
    await act(async () => {
      expect(await result.current.fundIssuingBalance(10.25)).toEqual({ error: null });
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("fund_issuing_balance", { p_amount: 10.25 });
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(2);
    expect(result.current.balances).toEqual({ usdAvailable: 90.25, usdIssuing: 30.5 });
  });

  it("returns RPC errors without refreshing or changing balances", async () => {
    const { result } = await loaded();
    mocks.rpc.mockResolvedValueOnce({ error: { message: "insufficient USD available balance" } });
    await act(async () => {
      expect(await result.current.fundIssuingBalance(101)).toEqual({ error: "insufficient USD available balance" });
    });
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
    expect(result.current.balances).toEqual({ usdAvailable: 100.5, usdIssuing: 20.25 });
  });
});
