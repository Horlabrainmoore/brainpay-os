# Architecture rules

- Keep payment-provider credentials and checkout-session creation in authenticated edge functions; the browser should receive only a validated hosted checkout URL to protect partner credentials.
- Use the shared headless TrustConnect provider and app-owned dialog for Bitcoin injected-wallet connections; do not mount WalletConnect-dependent views without an initialized pairing service, and keep keys and approval in the external wallet.
- Standardize shared page structure through DashboardLayout and semantic global tokens so every protected page follows the same workspace design.