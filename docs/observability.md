# docs/observability.md
# BrainJetPay Observability Runbook (v1)

This document describes the telemetry pipeline and how to deploy/debug it.

Components
- Frontend analytics: src/lib/analytics.ts
- Client traces: src/lib/performance.ts
- Client crash hooks: src/lib/crashlytics.ts
- Remote config helper: src/lib/remoteConfig.ts
- Cloud Functions (Gen2): functions/src
- Firestore rules: firestore.rules

Deployment
1. Add FIREBASE_SERVICE_ACCOUNT (base64 JSON) and FIREBASE_PROJECT_ID to GitHub secrets.
2. Ensure billing enabled (Blaze) for Gen2 functions and Firestore usage.
3. On the feature branch run local tests and deploy functions:
   - cd functions && npm install && npm run build
   - firebase deploy --project brainjetpay --only functions,firestore:rules

Debugging
- Use Firebase Console → Functions to view logs and executions.
- Confirm telemetry collections receive documents: blocks, mempool_stats, wallet_activity, audit_logs.

Security
- Never commit service account JSON or .env with secrets to the repo.
- Use Firestore rules provided in firestore.rules.

FAQ
- Q: Why Gen2? A: Better scaling and schedule reliability for scheduled tasks.
