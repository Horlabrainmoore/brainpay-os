# Architecture rules

- Keep payment-provider credentials and checkout-session creation in authenticated edge functions; the browser should receive only a validated hosted checkout URL to protect partner credentials.
- Use the shared headless TrustConnect provider and app-owned dialog for Bitcoin wallet connections; only initialize WalletConnect after a configured project ID is available, and keep keys and approval in the external wallet to avoid uninitialized mobile pairing and custody risks.
- Standardize shared page structure through DashboardLayout and semantic global tokens so every protected page follows the same workspace design.
- Handle Telegram updates in public edge functions with derived webhook verification and server-side link-token mapping, because Telegram cannot authenticate with the app's user session.
- Persist only masked card details and safe provider references for issuing workflows; never store PAN, CVV, identity images, or raw KYC payloads because they are sensitive cardholder data.