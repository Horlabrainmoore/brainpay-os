import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Index";

const state = vi.hoisted(() => ({
  balances: null as { usdAvailable: number; usdIssuing: number } | null,
  error: null as string | null,
  fundIssuingBalance: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock("@/hooks/useBalances", () => ({ useBalances: () => state }));
vi.mock("@/hooks/usePrices", () => ({ usePrices: () => ({ prices: {}, connected: false }) }));
vi.mock("@/hooks/useTransactions", () => ({ useTransactions: () => ({ transactions: [] }) }));
vi.mock("@/components/DashboardLayout", () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/MetricCard", () => ({ MetricCard: () => null }));
vi.mock("@/components/TransactionList", () => ({ TransactionList: () => null }));
vi.mock("@/components/SignalCard", () => ({ SignalCard: () => null }));
vi.mock("recharts", () => ({
  ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null,
  XAxis: () => null, YAxis: () => null, Tooltip: () => null, BarChart: () => null, Bar: () => null,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => { state.balances = null; state.error = null; vi.clearAllMocks(); });
afterEach(cleanup);

describe("dashboard issuing balance", () => {
  it("disables Add Funds until balances arrive and then displays them", () => {
    const { rerender } = render(<Dashboard />);
    expect(screen.getByRole("button", { name: "Add Funds" })).toBeDisabled();
    expect(screen.getByText("USD Available: —")).toBeInTheDocument();
    state.balances = { usdAvailable: 100.5, usdIssuing: 20.25 };
    rerender(<Dashboard />);
    expect(screen.getByText("$20.25")).toBeInTheDocument();
    expect(screen.getByText("USD Available: $100.50")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Funds" })).toBeEnabled();
  });

  it("shows balance errors and prevents opening the dialog", () => {
    state.error = "Unable to load balances";
    render(<Dashboard />);
    expect(screen.getByText(state.error)).toBeInTheDocument();
    expect(screen.queryByText(/USD Available:/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Funds" })).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("enables a loaded zero balance and passes it to dialog validation", () => {
    state.balances = { usdAvailable: 0, usdIssuing: 0 };
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Add Funds" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Amount (USD)" }), { target: { value: "0.01" } });
    expect(screen.getByRole("button", { name: "Confirm transfer" })).toBeDisabled();
    expect(screen.getByText(/Amount exceeds/)).toBeInTheDocument();
    expect(state.fundIssuingBalance).not.toHaveBeenCalled();
  });

  it("opens the funding dialog with balances, transfers, and closes on success", async () => {
    state.balances = { usdAvailable: 100.5, usdIssuing: 20.25 };
    render(<Dashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Add Funds" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("$100.50")).toBeInTheDocument();
    expect(dialog.getByText("$20.25")).toBeInTheDocument();
    fireEvent.change(dialog.getByRole("textbox", { name: "Amount (USD)" }), { target: { value: "10.25" } });
    expect(dialog.getByText("$30.50")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(dialog.getByRole("button", { name: "Confirm transfer" }));
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(state.fundIssuingBalance).toHaveBeenCalledExactlyOnceWith(10.25, expect.any(String));
  });
});
