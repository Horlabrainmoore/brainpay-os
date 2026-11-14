import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AddFundsDialog } from "./AddFundsDialog";
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

it("reuses the operation after RPC errors and rejected requests, then starts distinct transfers", async () => {
  const confirm = vi.fn()
    .mockResolvedValueOnce({ error: "timeout" })
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValue({ error: null });
  render(<AddFundsDialog open onOpenChange={vi.fn()} usdAvailable={100} usdIssuing={0} onConfirm={confirm} />);
  const input = screen.getByLabelText("Amount (USD)");
  fireEvent.change(input, { target: { value: "10" } });
  for (let i = 1; i <= 3; i++) {
    fireEvent.click(screen.getByRole("button", { name: "Confirm transfer" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(i));
    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm transfer" })).toBeInTheDocument());
  }
  const firstId = confirm.mock.calls[0][1];
  expect(confirm.mock.calls.slice(0, 3).map(call => call[1])).toEqual([firstId, firstId, firstId]);
  await waitFor(() => expect(input).toHaveValue(""));
  fireEvent.change(input, { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm transfer" }));
  await waitFor(() => expect(confirm).toHaveBeenCalledTimes(4));
  expect(confirm.mock.calls[3][1]).not.toBe(firstId);
});
