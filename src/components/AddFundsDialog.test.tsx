import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { AddFundsDialog } from "./AddFundsDialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

function setup(usdAvailable = 100) {
  const onConfirm = vi.fn().mockResolvedValue({ error: null });
  const onOpenChange = vi.fn();
  const view = render(<AddFundsDialog open onOpenChange={onOpenChange} usdAvailable={usdAvailable} usdIssuing={20} onConfirm={onConfirm} />);
  const input = screen.getByRole("textbox", { name: "Amount (USD)" });
  const confirm = screen.getByRole("button", { name: "Confirm transfer" });
  return { ...view, input, confirm, onConfirm, onOpenChange };
}

describe("AddFundsDialog", () => {
  it.each(["", " ", "abc", "0", "0.00", "-1", "1.234", "1e2", "1,000", ".50", "1."])("rejects invalid amount %j even on form submission", (value) => {
    const { input, confirm, onConfirm } = setup();
    fireEvent.change(input, { target: { value } });
    expect(confirm).toBeDisabled();
    expect(screen.queryByText("Resulting Issuing Balance")).not.toBeInTheDocument();
    fireEvent.submit(confirm.closest("form")!);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it.each([["0.01", "$20.01"], ["1.5", "$21.50"], [" 12.34 ", "$32.34"], ["100", "$120.00"]])("previews a valid amount %j", (value, expected) => {
    const { input, confirm } = setup();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    fireEvent.change(input, { target: { value } });
    expect(confirm).toBeEnabled();
    expect(screen.getByText("Resulting Issuing Balance")).toBeInTheDocument();
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([[100, "100.01"], [0, "0.01"], [0.29, "0.30"]])("blocks overspending a balance of %s", (available, value) => {
    const { input, confirm, onConfirm } = setup(available);
    fireEvent.change(input, { target: { value } });
    expect(screen.getByText(/Amount exceeds your USD Available Balance/)).toBeInTheDocument();
    expect(confirm).toBeDisabled();
    expect(screen.queryByText("Resulting Issuing Balance")).not.toBeInTheDocument();
    fireEvent.submit(confirm.closest("form")!);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("allows the exact fractional balance despite floating point representation", () => {
    const { input, confirm } = setup(0.1 + 0.2);
    fireEvent.change(input, { target: { value: "0.30" } });
    expect(confirm).toBeEnabled();
    expect(screen.getByText("$20.30")).toBeInTheDocument();
  });

  it("submits once while pending, then clears and closes on success", async () => {
    const { input, confirm, onConfirm, onOpenChange } = setup();
    let resolve!: (value: { error: null }) => void;
    onConfirm.mockReturnValue(new Promise((done) => { resolve = done; }));
    fireEvent.change(input, { target: { value: " 12.34 " } });
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(12.34);
    expect(screen.getByRole("button", { name: "Transferring…" })).toBeDisabled();
    fireEvent.submit(confirm.closest("form")!);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => { resolve({ error: null }); });
    expect(toast.success).toHaveBeenCalledWith("Added $12.34 to your Issuing Balance");
    expect(toast.error).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
    expect(confirm).toBeDisabled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps the amount and dialog open after an error and permits retry", async () => {
    const { input, confirm, onConfirm, onOpenChange } = setup();
    onConfirm.mockResolvedValueOnce({ error: "Insufficient funds" });
    fireEvent.change(input, { target: { value: "10" } });
    await act(async () => { fireEvent.click(confirm); });
    expect(toast.error).toHaveBeenCalledWith("Insufficient funds");
    expect(toast.success).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("10");
    expect(confirm).toBeEnabled();
    await act(async () => { fireEvent.click(confirm); });
    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
