import { TrustConnectProvider, useTrustModal, useConnection, useConnect } from "@trustwallet/connect-react";
import { createBIP122, mainnet } from "@trustwallet/connect-bip122-react";
import { Wallet, Copy, Unplug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const config = { namespaces: [createBIP122({ chain: mainnet })], services: [] };

export function WalletConnectionProvider({ children }: { children: React.ReactNode }) {
  return <TrustConnectProvider config={config} theme="light">{children}</TrustConnectProvider>;
}

export function WalletConnectionButton() {
  const { open } = useTrustModal();
  const { isConnected, address, isConnecting } = useConnection({ namespaceId: "bip122" });
  return <Button size="sm" variant="outline" onClick={() => open({ type: "namespace", namespaceId: "bip122" })} disabled={isConnecting}>
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