import { TrustConnectProvider, useConnection, useConnect, useWallets } from "@trustwallet/connect-headless";
import { createContext, useContext, useState } from "react";
import { createBIP122, mainnet } from "@trustwallet/connect-bip122-react";
import { Wallet, Copy, Unplug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const config = { namespaces: [createBIP122({ chain: mainnet })], services: [] };
const WalletDialogContext = createContext<(() => void) | null>(null);

export function useWalletDialog() {
  const open = useContext(WalletDialogContext);
  if (!open) throw new Error("Wallet dialog provider is missing");
  return open;
}

function WalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { wallets } = useWallets({ namespaceId: "bip122" });
  const { connect, disconnect, isLoading, error, clearError } = useConnect({ namespaceId: "bip122" });
  const { isConnected, address } = useConnection({ namespaceId: "bip122" });
  const connectWallet = async (wallet: (typeof wallets)[number]) => {
    clearError();
    try { await connect({ wallet }); onOpenChange(false); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Wallet connection failed"); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader><DialogTitle>Connect a wallet</DialogTitle><DialogDescription>Bitcoin · Mainnet</DialogDescription></DialogHeader>
      {isConnected ? <div className="space-y-3">
        <code className="block break-all text-xs">{address}</code>
        <Button variant="outline" onClick={() => { disconnect({ namespaceId: "bip122" }); onOpenChange(false); }}><Unplug />Disconnect</Button>
      </div> : wallets.length ? <div className="space-y-2">{wallets.map(wallet => <Button key={wallet.id} className="w-full justify-start" variant="outline" disabled={isLoading} onClick={() => connectWallet(wallet)}><Wallet />{wallet.name}{isLoading ? " · Connecting…" : ""}</Button>)}</div> : <div className="space-y-3">
        <p className="text-sm text-muted-foreground">No Bitcoin wallet extension detected. Mobile pairing is not configured.</p>
        <Button asChild variant="outline"><a href="https://trustwallet.com/download" target="_blank" rel="noopener noreferrer"><ExternalLink />Get Trust Wallet</a></Button>
      </div>}
      {error && <p role="alert" className="text-sm text-destructive">{error.message}</p>}
    </DialogContent>
  </Dialog>;
}

export function WalletConnectionProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <TrustConnectProvider config={config}><WalletDialogContext.Provider value={() => setOpen(true)}>
    {children}<WalletDialog open={open} onOpenChange={setOpen} />
  </WalletDialogContext.Provider></TrustConnectProvider>;
}

export function WalletConnectionButton() {
  const open = useWalletDialog();
  const { isConnected, address, isConnecting } = useConnection({ namespaceId: "bip122" });
  return <Button size="sm" variant="outline" aria-label={isConnected ? "Manage connected wallet" : "Connect wallet"} onClick={open} disabled={isConnecting}>
    <Wallet /> <span className="hidden sm:inline">{isConnecting ? "Connecting…" : isConnected ? `${address.slice(0, 6)}…${address.slice(-4)}` : "Connect wallet"}</span>
    <span className="sr-only sm:hidden">Connect wallet</span>
  </Button>;
}

export function WalletConnectionPanel() {
  const { isConnected, address, wallet, status } = useConnection({ namespaceId: "bip122" });
  const { disconnect } = useConnect();
  const copy = async () => {
    if (!address) return;
    try { await navigator.clipboard.writeText(address); toast.success("Address copied"); }
    catch { toast.error("Could not copy address"); }
  };
  return <section className="border-b border-border pb-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Wallet /></div>
        <div><h3 className="text-sm font-semibold">Connected wallet</h3><p className="text-xs text-muted-foreground">Bitcoin · Mainnet · {status}</p></div>
      </div>
      {isConnected ? <Button variant="outline" size="sm" onClick={() => disconnect({ namespaceId: "bip122" })}><Unplug />Disconnect</Button> : <WalletConnectionButton />}
    </div>
    {isConnected ? <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium">{wallet?.name}</span>
      <code className="min-w-0 break-all text-xs text-muted-foreground">{address}</code>
      <Button variant="ghost" size="icon" aria-label="Copy connected address" title="Copy address" onClick={copy}><Copy /></Button>
      <Button asChild variant="link" size="sm"><Link to={`/wallets/utxos?address=${encodeURIComponent(address)}`}>View outputs<ExternalLink /></Link></Button>
    </div> : <p className="mt-3 text-xs text-muted-foreground">No Bitcoin wallet connected. Keys and recovery phrases stay in your wallet.</p>}
  </section>;
}