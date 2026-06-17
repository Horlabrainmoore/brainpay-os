# trustwallet/assets

Community-curated repository of token logos and metadata for 180+ chains. Served as a free CDN — great for replacing placeholder icons.

- Repo: https://github.com/trustwallet/assets
- CDN base: `https://assets-cdn.trustwallet.com/blockchains`

## URL patterns

| Asset | URL |
|-------|-----|
| Chain native logo | `…/blockchains/<chain>/info/logo.png` |
| ERC-20 / token logo | `…/blockchains/<chain>/assets/<checksummed_address>/logo.png` |
| Chain info | `…/blockchains/<chain>/info/info.json` |
| Token info | `…/blockchains/<chain>/assets/<address>/info.json` |

`<chain>` is the folder name: `ethereum`, `binance`, `smartchain`, `solana`, `polygon`, `arbitrum`, `bitcoin`, `tron`, `ton`, …

```ts
export const tokenLogo = (chain: string, addr: string) =>
  `https://assets-cdn.trustwallet.com/blockchains/${chain}/assets/${addr}/logo.png`;

export const nativeLogo = (chain: string) =>
  `https://assets-cdn.trustwallet.com/blockchains/${chain}/info/logo.png`;
```

For Solana SPL tokens use the mint address. For non-checksummed EVM addresses, checksum first (e.g. with `ethers.getAddress`) or the CDN returns 404.

## Submitting new assets

1. Fork `trustwallet/assets`
2. Add `blockchains/<chain>/assets/<address>/logo.png` (256×256 PNG, transparent bg, <100KB)
3. Add `info.json`:

```json
{
  "name": "Token Name",
  "type": "ERC20",
  "symbol": "TKN",
  "decimals": 18,
  "website": "https://...",
  "description": "…",
  "explorer": "https://etherscan.io/token/0x...",
  "status": "active",
  "id": "0x...checksummed..."
}
```

4. PR. CI validates schema + image dimensions.

## Local fallback

Always provide a fallback (CDN returns 404 for unlisted tokens):

```tsx
<img
  src={tokenLogo("ethereum", addr)}
  onError={(e) => (e.currentTarget.src = "/placeholder-token.svg")}
  alt={symbol}
/>
```
