# Wallet Core

Cross-platform library for HD wallets, address derivation, and transaction signing across 140+ chains.

- Repo: https://github.com/trustwallet/wallet-core
- npm: `@trustwallet/wallet-core` (WASM build for web/Node)
- Native: Swift (CocoaPods/SPM), Kotlin (Maven), Go, Rust

## Install (web / Lovable)

```bash
bun add @trustwallet/wallet-core
```

The package ships a WASM binary. In Vite, import the initializer asynchronously:

```ts
import { initWasm } from "@trustwallet/wallet-core";

export const core = await initWasm(); // top-level await OK in modern Vite
```

Re-export from a single module (e.g. `src/lib/wallet-core.ts`) so the WASM only loads once.

## Common operations

### Create / restore HD wallet

```ts
const { HDWallet, Mnemonic } = core;

const wallet = HDWallet.create(128, ""); // 12-word mnemonic
const restored = HDWallet.createWithMnemonic(existingPhrase, "");
const phrase = wallet.mnemonic();
```

Always zero the wallet when done: `wallet.delete()`.

### Derive an address

```ts
const { CoinType, AnyAddress } = core;

const btcAddr = wallet.getAddressForCoin(CoinType.bitcoin);
const ethAddr = wallet.getAddressForCoin(CoinType.ethereum);
const solAddr = wallet.getAddressForCoin(CoinType.solana);
```

CoinType enum covers BTC, ETH (+ all EVM L2s via custom derivation), SOL, TRX, TON, APT, SUI, ATOM, etc.

### Sign a transaction

Use the `AnySigner` + per-chain protobuf SigningInput:

```ts
const { AnySigner, CoinType, HexCoding } = core;
import { TW } from "@trustwallet/wallet-core";

const input = TW.Ethereum.Proto.SigningInput.create({
  chainId: HexCoding.uint8Array(new Uint8Array([1])), // mainnet
  nonce: HexCoding.uint8Array(new Uint8Array([0])),
  gasPrice: HexCoding.uint8Array(/* ... */),
  gasLimit: HexCoding.uint8Array(/* ... */),
  toAddress: "0x...",
  privateKey: wallet.getKeyForCoin(CoinType.ethereum).data(),
  transaction: { transfer: { amount: /* wei */ } },
});

const output = AnySigner.sign(
  TW.Ethereum.Proto.SigningInput.encode(input).finish(),
  CoinType.ethereum,
);
const signedTx = TW.Ethereum.Proto.SigningOutput.decode(output);
const rawHex = HexCoding.encode(signedTx.encoded);
```

Each chain has its own `TW.<Chain>.Proto.SigningInput` shape — check `wallet-core/src/proto/*.proto`.

## Security rules

- **Never** transmit mnemonics or private keys to the server. Derive + sign client-side, send only the signed raw tx.
- Store mnemonics encrypted (see `src/lib/crypto.ts` AES-GCM-256 pattern already used in BrainPay OS).
- Call `.delete()` on `HDWallet`, `PrivateKey`, and `PublicKey` instances to wipe WASM memory.
