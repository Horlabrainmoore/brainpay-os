---
name: trust-wallet-sdk
description: Trust Wallet open-source libraries — Wallet Core (HD wallets, address derivation, tx signing in Swift/Kotlin/TypeScript/Go for 140+ chains), Web3 Provider (dApp connection for Ethereum/Solana/Cosmos/Bitcoin/Aptos/TON/Tron), deep linking, browser extension integration, WalletConnect, token assets repository, and Barz ERC-4337 smart wallet. Use when working with trustwallet/wallet-core, @trustwallet/wallet-core, trust-web3-provider, Trust Wallet deep links, token logos/metadata from trustwallet/assets, or Barz account abstraction.
---

# Trust Wallet SDK & Libraries

Open-source libraries for wallet integration, dApp connectivity, and smart wallets. This skill is a navigation map — load only the reference that matches the task.

## Reference Guide

| Task | Reference | Trigger phrases |
|------|-----------|-----------------|
| HD wallet, address derivation, tx signing | `references/wallet-core.md` | "wallet core", "derive address", "sign transaction", "mnemonic", "HD key" |
| Web3 provider, dApp connection | `references/trust-web3-provider.md` | "web3 provider", "dApp integration", "EIP-1193", "injected provider" |
| Deep links, extension, WalletConnect | `references/trust-developer.md` | "deep link", "browser extension", "WalletConnect", "wc:" |
| Token logos, metadata, CDN | `references/assets.md` | "token logo", "add asset", "trustwallet/assets", "info.json" |
| ERC-4337 smart wallet | `references/barz.md` | "smart wallet", "account abstraction", "ERC-4337", "Barz", "UserOperation" |

## When to use in BrainPay OS

- Adding a "Connect Wallet" flow on any page → `trust-web3-provider` + `trust-developer`
- Deriving / signing BTC, ETH, SOL transactions client-side (instead of mocking) → `wallet-core`
- Replacing emoji wallet icons with real token logos → `assets`
- Building gasless / smart-account features → `barz`

## Upstream

Official skill pack (preferred when possible): `npx skills add trustwallet/tw-agent-skills`
Docs: https://developer.trustwallet.com
