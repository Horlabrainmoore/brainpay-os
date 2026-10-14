# Integration Plan

## What will change
- Add Telegram send-and-receive support through the linked Telegram bot: an authenticated send action, a verified public webhook receiver, and an inbox view for received messages.
- Add an account settings panel to enter a WalletConnect project ID, show setup/readiness/pairing status, and make mobile pairing available only after configuration is valid.
- Add a KoraPay sandbox issuing workspace showing available and issuing USD balances, a transfer flow, cardholder/card creation, funding and withdrawal controls, and transaction status handling based on the uploaded API docs.

## Safety and readiness
- Keep provider credentials in Lovable Cloud secrets and call payment/card APIs only from authenticated Edge Functions; never expose full card data or identity documents in logs or ordinary lists.
- Scope persisted Telegram messages and issuing records to the authenticated user with RLS and explicit grants.
- Keep card actions in sandbox until credentials and KoraPay account requirements are confirmed. Do not represent demo balances as provider balances.

## Technical details
- Use the existing `DashboardLayout`, semantic tokens, shadcn controls, Supabase client, and Edge Function conventions.
- Add additive database migrations for webhook inbox and issuing records, with table grants before RLS policies.
- Use a public Telegram webhook endpoint with a derived secret token, idempotent `update_id` storage, and only necessary message fields.
- Validate request payloads at the client and function boundary; validate WalletConnect project ID before constructing TrustConnect's WalletConnect service.
- Add feature tests for safe wallet setup states and Telegram/issuing validation, then deploy affected functions and verify UI states in preview.
