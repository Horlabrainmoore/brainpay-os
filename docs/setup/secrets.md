# GitHub Secrets Setup for BrainPay OS

## Overview

BrainPay OS requires several GitHub Secrets for CI/CD and Cloud Functions deployment. This guide walks you through creating each one.

## Required Secrets (Blocking)

These must be set before any Cloud Functions can deploy.

### 1. FIREBASE_SERVICE_ACCOUNT

**Purpose:** Authenticate GitHub Actions to your Firebase project.

**Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project `brainjetpay`
3. Navigate to **IAM & Admin → Service Accounts**
4. Click the service account (usually `deploy@brainjetpay.iam.gserviceaccount.com`)
5. Click **Keys → Create new key → JSON**
6. Download the JSON file
7. Run:
   ```bash
   cat /path/to/service-account.json | base64 | tr -d '\n' | pbcopy
   ```
8. Go to GitHub: **Settings → Secrets and variables → Actions**
9. Click **New repository secret**
10. Name: `FIREBASE_SERVICE_ACCOUNT`
11. Value: Paste the base64 JSON
12. Click **Add secret**

### 2. FIREBASE_PROJECT_ID

**Purpose:** Target Firebase project for deployments.

**Steps:**
1. Go to GitHub: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `FIREBASE_PROJECT_ID`
4. Value: `brainjetpay`
5. Click **Add secret**

## Optional Secrets (Non-Blocking)

These can be added as you integrate each provider.

### Provider Webhooks

```bash
# Payments
WEBHOOK_SECRET_SQUARE=sk_...
WEBHOOK_SECRET_KORA=...
WEBHOOK_SECRET_BITPAY=...

# Crypto
WEBHOOK_SECRET_COINBASE=...
WEBHOOK_SECRET_BLOCKCYPHER=...

# Trading
WEBHOOK_SECRET_MT5=...
WEBHOOK_SECRET_EXNESS=...

# Automation
WEBHOOK_SECRET_QSTASH=...
WEBHOOK_SECRET_BOX=...
WEBHOOK_SECRET_CHAINLINK=...
```

### Provider APIs

```bash
# Buy Crypto
COINBASE_API_KEY=...
COINBASE_API_SECRET=...
MOONPAY_API_KEY=...
BANXA_API_KEY=...
TRANSAK_API_KEY=...
RAMP_API_KEY=...

# Wallet
TRUST_WALLET_APP_ID=...

# Blockchain
MEMPOOL_API_BASE=https://mempool.space
BLOCKCYPHER_TOKEN=...

# AI & Observability
OPENAI_API_KEY=sk_...
OTEL_EXPORTER_OTLP_ENDPOINT=...
```

## Using the CLI

If you have the GitHub CLI installed:

```bash
# Set a secret
gh secret set FIREBASE_PROJECT_ID --body "brainjetpay"

# Set a secret from a file
cat service-account.json | base64 | tr -d '\n' | gh secret set FIREBASE_SERVICE_ACCOUNT

# List all secrets
gh secret list
```

## Verification

After setting secrets:

```bash
gh secret list --repo Horlabrainmoore/brainpay-os
```

You should see all configured secrets listed.

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Rotate service account keys periodically**
3. **Use least-privilege IAM roles** (e.g., Cloud Functions Admin, Firestore Admin)
4. **Enable audit logging** in GCP Console
5. **Restrict API key usage** to specific domains/IPs
