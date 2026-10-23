# BrainPay MT5 service

This service provides a read-only, persistent connection to a MetaTrader 5 demo account and exposes internal HTTP endpoints for BrainPay to read account and trading state.

Key features:
- Persistent MT5 session with automatic reconnect and heartbeat
- Read-only: no trading or order modification commands
- Internal API authenticated with MT5_INTERNAL_API_KEY

Run locally
1. cd services/mt5
2. python -m venv .venv && source .venv/bin/activate
3. pip install -r requirements.txt
4. copy .env.example to .env and set MT5_ACCOUNT_ID, MT5_PASSWORD, MT5_SERVER, and MT5_INTERNAL_API_KEY
5. uvicorn services.mt5.api:app --host 0.0.0.0 --port 8001 --reload

Security
- Do NOT commit real credentials. Use environment variables or a secrets manager.
- Keep MT5_READ_ONLY_MODE=true for initial deployment.

Notes
- The MetaTrader5 package may require a locally-installed MT5 terminal or a broker-provided API bridge. For CI and unit tests we mock the mt5 module.
