# Barz — ERC-4337 Smart Wallet

Trust Wallet's modular smart contract wallet built on ERC-4337 account abstraction. Diamond pattern (EIP-2535) — features added/removed via facets.

- Repo: https://github.com/trustwallet/barz
- Audits: by Quantstamp, Veridise (see repo `audits/`)

## Why Barz vs a plain EOA

- Social recovery (guardians)
- Multi-sig (multiple signer facets)
- Gasless txs via Paymaster
- Session keys / spending limits
- Upgradeable per-account (add/remove facets without redeploy)

## Architecture

```
Barz (proxy)  ──delegatecall──▶  Diamond facets
                                   ├─ AccountFacet     (validateUserOp, execute)
                                   ├─ Secp256k1VerificationFacet  (ECDSA)
                                   ├─ Secp256r1VerificationFacet  (passkeys / WebAuthn)
                                   ├─ MultisigFacet
                                   ├─ GuardianFacet    (social recovery)
                                   ├─ TokenReceiverFacet
                                   └─ RestrictionsFacet (spending limits)
```

`AccountFacet` implements `IAccount.validateUserOp` and delegates signature checks to whichever Verification Facet the user installed.

## Deploying a Barz account

1. Deploy `BarzFactory(defaultFallback, entryPoint)` once per chain (or reuse Trust's).
2. Compute counterfactual address: `factory.getAddress(verificationFacet, ownerPubKey, salt)`.
3. Send a UserOperation with `initCode = factory.address + createAccount(...)` calldata — bundler will deploy on first op.

## Sending a UserOperation

Use any 4337 SDK (e.g. `permissionless`, `userop.js`):

```ts
import { createSmartAccountClient } from "permissionless";

const client = createSmartAccountClient({
  account: barzAccount,           // your Barz instance wrapper
  chain: sepolia,
  bundlerTransport: http(BUNDLER_URL),
  middleware: { sponsorUserOperation: paymaster.sponsorUserOperation },
});

const hash = await client.sendTransaction({
  to: "0x...",
  value: parseEther("0.01"),
});
```

`validateUserOp` inside Barz routes signature verification to the installed VerificationFacet — so passkey (R1) and ECDSA (K1) accounts use the same code path.

## Adding a facet

```solidity
IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
cuts[0] = IDiamondCut.FacetCut({
  facetAddress: address(guardianFacet),
  action: IDiamondCut.FacetCutAction.Add,
  functionSelectors: guardianSelectors
});
IDiamondCut(barz).diamondCut(cuts, address(0), "");
```

Always call `diamondCut` through a UserOperation so the wallet's own validation rules apply.

## Gotchas

- ERC-4337 storage rules: avoid accessing non-account storage during `validateUserOp` or the bundler will reject.
- VerificationFacet swaps are powerful **and** dangerous — gate behind guardian approval or timelock.
- Counterfactual addresses change if you change `defaultFallback`, salt, or initial facet config.
