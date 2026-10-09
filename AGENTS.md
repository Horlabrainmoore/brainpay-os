# Architecture rules

- Keep payment-provider credentials and checkout-session creation in authenticated edge functions; the browser should receive only a validated hosted checkout URL to protect partner credentials.
- Use a shared TrustConnect provider for Bitcoin injected-wallet connections; keep private keys and signing approval in the external wallet to avoid custody.
- Standardize shared page structure through DashboardLayout and semantic global tokens so every protected page follows the same workspace design.