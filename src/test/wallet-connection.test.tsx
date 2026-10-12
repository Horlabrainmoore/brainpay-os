import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WalletConnectionProvider, WalletConnectionButton } from "@/components/WalletConnection";

const state = vi.hoisted(() => ({ wallets: [] as Array<{ id: string; name: string }>, connect: vi.fn() }));
vi.mock("@trustwallet/connect-headless", () => ({
  TrustConnectProvider: ({ children }: { children: React.ReactNode }) => children,
  useWallets: () => ({ wallets: state.wallets }),
  useConnection: () => ({ isConnected: false, isConnecting: false }),
  useConnect: () => ({ connect: state.connect, disconnect: vi.fn(), isLoading: false, error: null, clearError: vi.fn() }),
}));
vi.mock("@trustwallet/connect-bip122-react", () => ({ createBIP122: vi.fn(), mainnet: "mainnet" }));

describe("extension-only wallet dialog", () => {
  beforeEach(() => { state.wallets = []; state.connect.mockReset(); });
  it("opens safely without a WalletConnect service or installed wallet", () => {
    render(<WalletConnectionProvider><WalletConnectionButton /></WalletConnectionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mobile pairing is not configured/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("passes the selected extension to the connection engine", async () => {
    const wallet = { id: "test-wallet", name: "Test Bitcoin Wallet" };
    state.wallets = [wallet]; state.connect.mockResolvedValue(undefined);
    render(<WalletConnectionProvider><WalletConnectionButton /></WalletConnectionProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    fireEvent.click(screen.getByRole("button", { name: "Test Bitcoin Wallet" }));
    await waitFor(() => expect(state.connect).toHaveBeenCalledWith({ wallet }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});