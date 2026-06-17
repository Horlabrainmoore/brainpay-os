# Deep Links, Extension, WalletConnect

How dApps and external apps hand off to Trust Wallet.

## Deep links

Base: `https://link.trustwallet.com/<action>?<params>`

| Action | Params | Use |
|--------|--------|-----|
| `open_url` | `url=` | Open URL in Trust in-app browser |
| `send` | `asset=<CAIP>&address=&amount=&memo=` | Pre-fill native/token send |
| `swap` | `from=<CAIP>&to=<CAIP>&amount=` | Pre-fill swap |
| `add_asset` | `asset=<CAIP>` | Prompt user to add token |
| `wc` | `uri=<wc:...>` | Open WalletConnect URI |

`<CAIP>` is the CAIP-19 asset id, e.g. `c60` = ETH, `c714` = BNB, `c60_t0x...` = ERC-20.

```ts
const url = new URL("https://link.trustwallet.com/send");
url.searchParams.set("asset", "c60");
url.searchParams.set("address", "0xabc...");
url.searchParams.set("amount", "0.1");
window.location.href = url.toString();
```

## Browser extension detection

```ts
const isTrust = () => Boolean((window as any).trustwallet?.isTrust);
```

After detection, treat `window.trustwallet.ethereum` as the EIP-1193 provider (same shape as MetaMask). For multi-chain access use `window.trustwallet.solana`, `.bitcoin`, etc.

## WalletConnect v2

Trust Wallet supports WC v2. Standard flow:

```bash
bun add @walletconnect/sign-client @walletconnect/modal
```

```ts
import { SignClient } from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";

const signClient = await SignClient.init({
  projectId: import.meta.env.VITE_WC_PROJECT_ID,
  metadata: { name: "BrainPay OS", description: "...", url: location.origin, icons: [] },
});

const { uri, approval } = await signClient.connect({
  requiredNamespaces: {
    eip155: {
      methods: ["eth_sendTransaction", "personal_sign"],
      chains: ["eip155:1"],
      events: ["chainChanged", "accountsChanged"],
    },
  },
});

if (uri) {
  // Either show QR with the modal:
  new WalletConnectModal({ projectId: import.meta.env.VITE_WC_PROJECT_ID }).openModal({ uri });
  // Or deep-link directly to Trust:
  location.href = `https://link.trustwallet.com/wc?uri=${encodeURIComponent(uri)}`;
}

const session = await approval();
```
