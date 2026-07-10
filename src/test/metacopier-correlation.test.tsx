import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the supabase client used by both metacopier lib and LogsPage
const invokeMock = vi.fn();
const selectMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
    from: () => ({
      select: () => ({
        order: () => ({
          limit: () => selectMock(),
        }),
      }),
    }),
  },
}));

// Avoid pulling in the full DashboardLayout tree (sidebar/auth/router)
vi.mock("@/components/DashboardLayout", () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// mock-data is imported by LogsPage; keep it minimal
vi.mock("@/lib/mock-data", () => ({ systemLogs: [] }));

import { metacopier } from "@/lib/metacopier";
import LogsPage from "@/pages/LogsPage";

function renderWithClient(ui: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("MetaCopier correlation ID", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    selectMock.mockReset();
  });

  it("forwards a correlation ID header on every proxy call", async () => {
    invokeMock.mockResolvedValue({
      data: { status: 200, ok: true, data: [], correlationId: "srv-cid-123" },
      error: null,
    });

    await metacopier.listAccounts();

    expect(invokeMock).toHaveBeenCalledTimes(1);
    const [fnName, opts] = invokeMock.mock.calls[0] as [string, { headers: Record<string, string> }];
    expect(fnName).toBe("metacopier-proxy");
    const cid = opts.headers["x-correlation-id"];
    expect(cid).toBeTruthy();
    expect(typeof cid).toBe("string");
    expect(cid.length).toBeGreaterThanOrEqual(8);
  });

  it("surfaces the correlation ID in thrown errors", async () => {
    invokeMock.mockResolvedValue({
      data: { status: 500, ok: false, data: { message: "boom" }, correlationId: "srv-err-999" },
      error: null,
    });

    await expect(metacopier.listAccounts()).rejects.toThrow(/srv-err-999/);
  });

  it("renders the correlation ID chip in the Logs UI", async () => {
    selectMock.mockResolvedValue({
      data: [
        {
          id: "row-1",
          correlation_id: "abcdef1234567890",
          path: "/rest/api/v1/accounts",
          method: "GET",
          status: 200,
          ok: true,
          duration_ms: 42,
          error: null,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });

    renderWithClient(<LogsPage />);

    // Switch to the MetaCopier proxy tab
    const tab = await screen.findByRole("tab", { name: /MetaCopier proxy/i });
    fireEvent.pointerDown(tab, { button: 0, pointerType: "mouse" });
    fireEvent.mouseDown(tab, { button: 0 });
    fireEvent.click(tab);

    await waitFor(() => {
      expect(screen.getByText(/cid:/i)).toBeInTheDocument();
    });
    // Truncated form: first 8 + last 4
    expect(screen.getByText(/abcdef12.*7890/)).toBeInTheDocument();
  });
});
