# Roadmap

- [x] Fix uninitialized WalletConnect crash and verify mobile-browser wallet dialog (opens/closes without runtime errors; two regression tests pass)
- [x] Standardize Cloud White workspace, typography, navigation, and shared page controls
- [x] Add TrustConnect Bitcoin wallet connection and verify the connection modal (signed-in browser; no injected wallet detected)
- [ ] Verify connect/disconnect with an actual Bitcoin wallet (requires the user's wallet extension and approval)

- [x] MCP server (6 tools, OAuth 2.1) deployed at /functions/v1/mcp
- [x] Agent Integrations page (/agent-integrations): MCP status, tool list, approved clients & scopes
- [x] Consent screen records approvals into oauth_client_consents
- [x] Exchange REST API proxy (exchange-proxy edge fn, HMAC-SHA256 server-side signing)
- [x] Exchange page (/exchange): market data, order book, balances, orders, fills
- [x] EXCHANGE_BASE_URL / EXCHANGE_API_KEY / EXCHANGE_SECRET_KEY configured
- [ ] Verify live market data + account endpoints with real exchange (needs an API host that permits the server's region and valid credentials)
- [x] BTC Direct Buy page, protected checkout handler, and mainnet address validation
- [ ] BTC Direct sandbox checkout verification (requires confirmed sandbox credentials and a user-provided Bitcoin mainnet address)
