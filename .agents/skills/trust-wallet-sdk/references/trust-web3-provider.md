# trust-web3-provider

Multi-chain injected provider Trust Wallet uses to make dApps work inside its in-app browser. You can embed it in any web app to expose an EIP-1193-compatible `window.ethereum` (plus Solana / Cosmos / TON / Aptos / TRON / BTC variants).

- Repo: https://github.com/trustwallet/trust-web3-provider
- Packages: `@trustwallet/web3-provider-core`, `@trustwallet/web3-provider-ethereum`, `@trustwallet/web3-provider-solana`, etc.

## Install

```bash
bun add @trustwallet/web3-provider-core @trustwallet/web3-provider-ethereum
```

## Wire it up

```ts
import { Web3Provider } from "@trustwallet/web3-provider-core";
import { EthereumProvider } from "@trustwallet/web3-provider-ethereum";

const ethereum = new EthereumProvider({
  chainId: 1,
  rpc: "https://cloudflare-eth.com",
  address: userAddress, // from your wallet logic (e.g. wallet-core)
});

const provider = new Web3Provider({
  strategy: "CALLBACK", // or 'PROMISES'
  handler: async (request) => {
    // Route by request.method — return result or throw
    switch (request.method) {
      case "eth_sendTransaction":
        return signAndBroadcast(request.params[0]); // your signer
      case "personal_sign":
        return signMessage(request.params[0]);
      default:
        return ethereum.request(request); // delegate read-only RPC
    }
  },
});

provider.registerProvider(ethereum);
provider.injectProviders(); // exposes window.ethereum
```

## Per-chain modules

| Chain | Package |
|-------|---------|
| Ethereum / EVM | `@trustwallet/web3-provider-ethereum` |
| Solana | `@trustwallet/web3-provider-solana` |
| Cosmos | `@trustwallet/web3-provider-cosmos` |
| Bitcoin | `@trustwallet/web3-provider-bitcoin` |
| TON | `@trustwallet/web3-provider-ton` |
| Aptos | `@trustwallet/web3-provider-aptos` |
| TRON | `@trustwallet/web3-provider-tron` |

Each follows the same `registerProvider` pattern.

## Common requests to handle

- `eth_requestAccounts` / `eth_accounts` — return `[address]`
- `wallet_switchEthereumChain` — update `chainId`, re-emit `chainChanged`
- `eth_sendTransaction`, `eth_signTransaction`, `personal_sign`, `eth_signTypedData_v4`
- `wallet_addEthereumChain` — append RPC to your config
