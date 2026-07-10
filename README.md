# 🧠 BrainPay-OS — Crypto Intelligence Operating System

A production-grade full-stack cryptocurrency intelligence platform combining Bitcoin payments, DAO governance, AI agents, on-chain analytics, and fiat ↔ crypto onboarding into a unified operating system.

---

## 🚀 What is BrainPay-OS?

BrainPay-OS is an open-source, modular crypto-fintech operating system that transforms how organizations:

- **Accept Payments** — Bitcoin, Lightning, and multi-chain settlements via BTCPay
- **Onboard Users** — Fiat → Crypto acquisition via Stripe Crypto Onramp
- **Govern Treasuries** — DAO-controlled wallets with governance voting and proposal execution
- **Monitor On-Chain** — Real-time Bitcoin mempool analysis, wallet intelligence, and risk scoring
- **Make Intelligent Decisions** — AI agents that analyze blockchain data and execute treasury operations
- **Track Observability** — End-to-end telemetry with Firebase Analytics, Crashlytics, and BigQuery

---

## ⚙️ Core Stack

### Frontend
- **React 18** + TypeScript
- **Vite** — Fast build system
- **Tailwind CSS** + **shadcn/ui** — Modern UI components
- **TanStack React Query** — Data fetching and caching
- **React Router DOM** — Client routing
- **Recharts** — Real-time data visualization

### Backend & Infrastructure
- **Firebase** — Authentication, Firestore (realtime DB), Cloud Functions (Gen2)
- **Supabase** — PostgreSQL alternative with RLS
- **Vercel** — Deployment and serverless functions
- **Firebase Admin SDK** — Server-side operations

### Blockchain Layer
- **Mempool.js** (v3.0.0) — Bitcoin mempool API client
- **mempool.space** — Public mempool explorer with WebSocket support
- **Bitcoin RPC** — Direct node communication
- **BTCPay** — Self-hosted payment processor (Greenfield API)
- **Lightning Network** — Second-layer scaling (roadmap)

### Payment & Onramp
- **Stripe Crypto Onramp** — Fiat-to-crypto gateway (in progress)
- **BTCPay Greenfield API** — Crypto payment invoices and webhooks

### Observability & Analytics
- **Firebase Analytics** — Frontend event tracking
- **Crashlytics** — Real-time crash reporting
- **Performance Monitoring** — Core Web Vitals & custom metrics
- **Remote Config** — Feature flags and A/B testing
- **BigQuery** — Data warehouse for analytics
- **Looker Studio** — Executive dashboards

### Security
- **GitHub Secret Scanning** — Automated credential detection
- **Firestore Security Rules** — Fine-grained access control
- **Environment Variables** — Secrets management via GitHub Actions
- **MPC Treasury** — Multi-signature wallet operations (roadmap)

---

## 📦 Key Dependencies

```json
{
  "@mempool/mempool.js": "^3.0.0",
  "@supabase/supabase-js": "^2.105.1",
  "firebase": "^12.15.0",
  "@tanstack/react-query": "^5.83.0",
  "react-router-dom": "^6.30.1",
  "recharts": "^3.8.1",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1"
}
```

---

## 🎯 Features

### ✅ Phase 1 — Core Blockchain Intelligence
- [x] Bitcoin address querying (balance, tx count, unconfirmed balance)
- [x] Mempool fee estimation (fast, standard, slow)
- [x] Block height tracking
- [x] Transaction history viewer
- [x] Address validation (P2P, P2SH, Bech32)
- [x] Real-time wallet analytics dashboard

### ✅ Phase 2 — Payment Engine
- [x] BTCPay Greenfield API integration
- [x] Transaction broker (route payments across chains)
- [x] Invoice service (create, track, settle)
- [x] Wallet service (generate, manage addresses)
- [x] Webhook processor (real-time payment events)

### 🔄 Phase 3 — Fiat Onramp (In Progress)
- [ ] Stripe Crypto Onramp application & approval
- [ ] Hosted onramp UI integration
- [ ] Embedded widget mode
- [ ] Webhook event listeners
- [ ] Wallet funding automation

### 🔄 Phase 4 — Telemetry Stack (In Progress)
- [x] Firebase Analytics setup
- [x] Crashlytics configuration
- [x] Performance monitoring
- [ ] BigQuery export pipeline
- [ ] Looker Studio dashboards

### 📋 Phase 5 — DAO Governance (Planned)
- [ ] Snapshot voting integration
- [ ] Tally governance UI
- [ ] Proposal creation & voting
- [ ] Treasury execution queue
- [ ] Multi-sig enforcement

### 🤖 Phase 6 — AI Agents (Planned)
- [ ] Treasury Agent (query treasury state)
- [ ] Risk Agent (analyze portfolio risk)
- [ ] DAO Agent (governance recommendations)
- [ ] Payment Agent (optimize routes)
- [ ] Compliance Agent (KYC/AML checks)

---

## 📂 Project Structure

```
brainpay-os/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/            # Page-level components
│   ├── hooks/            # Custom React hooks (useMempoolBtc, etc.)
│   ├── lib/              # Utility functions
│   │   ├── analytics.ts  # Firebase Analytics wrapper
│   │   ├── btc-address.ts# Bitcoin address validation
│   │   ├── mempool.ts    # Mempool API utilities
│   │   └── firebase.ts   # Firebase initialization
│   ├── styles/           # Global CSS & Tailwind config
│   └── App.tsx           # Root component
├── functions/            # Firebase Cloud Functions (Gen2)
│   ├── src/
│   │   ├── mempoolClient.ts     # Mempool API client
│   │   ├── btcpayBroker.ts      # BTCPay payment broker
│   │   ├── walletService.ts     # Wallet operations
│   │   ├── webhookProcessor.ts  # Payment webhooks
│   │   └── index.ts             # Function exports
│   └── package.json
├── docs/                 # Documentation
│   ├── architecture.md   # System design
│   ├── mempool-sync.md   # Mempool integration guide
│   ├── observability.md  # Telemetry runbook
│   └── api.md            # API reference
├── schemas/              # JSON Schema definitions
│   ├── mempool.schema.json
│   └── transaction.schema.json
├── data/                 # Sample/cached data
│   └── mempool-events.json
├── package.json          # Frontend dependencies
├── vite.config.ts        # Vite build config
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind CSS config
└── README.md             # This file
```

---

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (free tier OK for dev)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Horlabrainmoore/brainpay-os.git
   cd brainpay-os
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local
   cat > .env.local << 'EOF'
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   
   # Optional: Stripe Onramp (when approved)
   VITE_STRIPE_ONRAMP_CLIENT_ID=your-stripe-client-id
   
   # Optional: BTCPay (self-hosted)
   VITE_BTCPAY_API_URL=https://your-btcpay-instance.com
   VITE_BTCPAY_API_KEY=your-btcpay-api-key
   
   # Mempool API (defaults to mempool.space)
   VITE_MEMPOOL_API_BASE=https://mempool.space
   EOF
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

---

## 🔌 Mempool.js API Integration

BrainPay-OS uses **@mempool/mempool.js** (v3.0.0) for on-chain Bitcoin data.

### Supported Features

```typescript
import mempoolJS from '@mempool/mempool.js';

const { bitcoin } = mempoolJS({ hostname: 'mempool.space' });

// Addresses
await bitcoin.addresses.getAddress({ address: '...' });
await bitcoin.addresses.getAddressTxs({ address: '...', from_index: 0, to_index: 24 });
await bitcoin.addresses.getAddressUtxo({ address: '...' });

// Transactions
await bitcoin.transactions.getTx({ txid: '...' });
await bitcoin.transactions.getTxRbfHistory({ txid: '...' });
await bitcoin.transactions.getTxOutspends({ txid: '...' });

// Blocks
await bitcoin.blocks.getBlocksTipHeight();
await bitcoin.blocks.getBlock({ hash: '...' });
await bitcoin.blocks.getBlockTxs({ hash: '...', index: 0 });

// Fees
await bitcoin.fees.getFeesRecommended(); // { fastestFee, halfHourFee, hourFee, economyFee, minimumFee }

// Mempool
await bitcoin.mempool.getMempool();
await bitcoin.mempool.getMempoolTxids();
await bitcoin.mempool.getMempoolRecent();
```

### Usage Example (React Hook)

```typescript
// src/hooks/useMempoolBtc.tsx
export function useMempoolBtc(address?: string) {
  const [stats, setStats] = useState<BtcAddressStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { bitcoin } = mempoolJS({ hostname: 'mempool.space' });
    (async () => {
      try {
        const addr = await bitcoin.addresses.getAddress({ address });
        const fees = await bitcoin.fees.getFeesRecommended();
        setStats({ /* compute balance, txCount, etc */ });
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [address]);

  return { stats, error };
}
```

### Address Viewer Page

```typescript
// src/pages/AddressTxPage.tsx
export default function AddressTxPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [txs, setTxs] = useState<MempoolTx[] | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const { bitcoin } = mempoolJS({ hostname: 'mempool.space' });
    (async () => {
      const list = await bitcoin.addresses.getAddressTxs({ address });
      setTxs(list as MempoolTx[]);
    })();
  }, [address]);

  return (
    <DashboardLayout>
      {/* Address search form */}
      {/* Transaction pagination */}
    </DashboardLayout>
  );
}
```

---

## 🔗 BTCPay Integration (Phase 2)

### Greenfield API Client

```typescript
// functions/src/btcpayBroker.ts
import { btcpay } from './config';

export async function createInvoice(params: {
  amount: number;
  currency: 'BTC' | 'USD';
  orderId: string;
  webhookUrl: string;
}) {
  const invoice = await btcpay.clients.invoice.createInvoice(
    params.storeId,
    {
      amount: params.amount.toString(),
      currency: params.currency,
      orderId: params.orderId,
      serverIpn: params.webhookUrl,
      extendedNotifications: true,
    }
  );
  return invoice;
}
```

### Webhook Processor

```typescript
// functions/src/webhookProcessor.ts
export async function processBTCPayWebhook(req: Request) {
  const event = req.body;
  
  switch (event.type) {
    case 'InvoiceCreated':
      // Log invoice creation
      break;
    case 'InvoiceReceivedPayment':
      // Update wallet balance
      break;
    case 'InvoiceProcessing':
      // Mark as confirmed in DB
      break;
    case 'InvoiceExpired':
      // Clean up expired invoice
      break;
  }
}
```

---

## 📊 Telemetry & Observability

### Firebase Analytics

```typescript
// src/lib/analytics.ts
import { logEvent } from 'firebase/analytics';

export function trackPayment(amount: number, currency: string) {
  logEvent(analytics, 'payment_completed', {
    value: amount,
    currency: currency,
    timestamp: new Date().toISOString(),
  });
}
```

### BigQuery Export Pipeline

Setup Cloud Firestore → BigQuery export scheduled daily:

```bash
# Deploy export function
firebase deploy --only functions:exportToBigQuery
```

### Key Metrics

- **Wallet Activity**: Active addresses, balance changes, tx volume
- **Payment Metrics**: Invoice count, success rate, avg settlement time
- **Mempool Metrics**: Avg fee rate, tx backlog, confirmation times
- **Treasury**: Inflow/outflow, governance activity, risk score

---

## 🔒 Security Best Practices

### Secrets Management
- ✅ All secrets stored in GitHub Actions secrets (not .env in repo)
- ✅ Firebase service account key base64-encoded
- ✅ Private keys never committed to git
- ✅ GitHub secret scanning enabled

### Firestore Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wallets/{walletId} {
      allow read: if request.auth.uid == resource.data.owner_uid;
      allow write: if request.auth.uid == resource.data.owner_uid && isValidWallet(request.resource.data);
    }
  }
}
```

---

## 🧪 Testing

### Unit Tests

```bash
npm run test          # Run tests once
npm run test:watch   # Watch mode
```

### Integration Tests

```bash
# Test Mempool API connectivity
npm run test -- useMempoolBtc

# Test Firebase functions locally
firebase emulators:start
```

### Manual Testing

1. **Local dev**: `npm run dev` → http://localhost:5173
2. **Staging build**: `npm run build` → `npm run preview`
3. **Production**: Deploy via Vercel (auto-deploys main branch)

---

## 📈 Deployment

### Vercel (Frontend)

```bash
# Connect repo to Vercel
# Environment variables auto-synced from GitHub secrets
# Auto-deploys on main branch push
```

### Firebase (Backend Functions)

```bash
# Deploy Cloud Functions
cd functions
npm run build
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy scheduled functions
firebase deploy --only functions:exportToBigQuery
```

### Git Workflow

```bash
# Create feature branch
git switch -c feat/payments/stripe-onramp

# Commit with conventional commits
git commit -m "feat(payments): add stripe onramp widget"

# Push and open PR
git push -u origin feat/payments/stripe-onramp

# Merge after review → auto-deploy
```

---

## 🗺️ Roadmap

### Q3 2026 — Foundation (Current)
- [x] Bitcoin wallet telemetry
- [x] Mempool analytics
- [x] Observability pipeline
- [ ] Stripe Onramp approval
- [ ] BTCPay payment engine

### Q4 2026 — Payments
- [ ] Full BTCPay integration
- [ ] Stripe Onramp live
- [ ] Lightning Network support
- [ ] Multi-chain wallet hub

### Q1 2027 — Intelligence
- [ ] DAO governance engine
- [ ] AI agents framework
- [ ] Risk scoring engine
- [ ] Treasury dashboard

### Q2 2027 — Scale
- [ ] MPC treasury (multi-sig)
- [ ] Institutional APIs
- [ ] IPFS audit logs
- [ ] Compliance automation

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Git workflow and branch naming
- Conventional commit style
- PR template and checklist
- Code review process

### Quick PR Workflow

```bash
# 1. Sync main
git switch main && git pull --rebase origin main

# 2. Create branch
git switch -c feat/scope/short-desc

# 3. Commit & push
git add . && git commit -m "feat(scope): short description"
git push -u origin feat/scope/short-desc

# 4. Open PR with template
```

---

## 📚 Documentation

- **[Architecture](docs/architecture.md)** — System design & data flow
- **[Mempool Integration](docs/mempool-sync.md)** — Bitcoin data pipeline
- **[Observability](docs/observability.md)** — Telemetry & debugging
- **[API Reference](docs/api.md)** — Endpoint documentation

---

## 🆘 Troubleshooting

### "Mempool API request failed"

```typescript
// Check API status
const { bitcoin } = mempoolJS({ hostname: 'mempool.space' });
await bitcoin.blocks.getBlocksTipHeight(); // Should return block height
```

### "Firebase credentials not found"

```bash
# Verify .env.local exists with all required keys
cat .env.local | grep VITE_FIREBASE
```

### "Cloud Functions deploy fails"

```bash
# Ensure Blaze tier enabled (pay-as-you-go)
firebase projects:list
firebase functions:config:set
firebase deploy --only functions
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Horlabrainmoore/brainpay-os/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Horlabrainmoore/brainpay-os/discussions)
- **Mempool API Docs**: [mempool.space/api](https://mempool.space/api)
- **Firebase Docs**: [firebase.google.com](https://firebase.google.com)

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Mempool.space** — Bitcoin blockchain data & mempool API
- **Firebase** — Realtime database & cloud infrastructure
- **Stripe** — Crypto onramp & payment processing
- **BTCPay** — Open-source payment processor
- **shadcn/ui** — Beautiful React components
- **Vite** — Next-generation build tool

---

**Built with ⚡ for Bitcoin intelligence. Secure. Decentralized. Open-source.**
