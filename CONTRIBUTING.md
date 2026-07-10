# Contributing to BrainPay-OS

## Welcome! 🚀

BrainPay-OS is an open-source crypto intelligence platform. We welcome contributions from developers, designers, and enthusiasts. This guide will help you get started.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Report security issues privately (see Security section)
- Celebrate effort and progress

---

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- npm or yarn
- GitHub account
- Firebase project (dev tier OK)

### Clone & Setup

```bash
# 1. Fork the repository
# https://github.com/Horlabrainmoore/brainpay-os/fork

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/brainpay-os.git
cd brainpay-os

# 3. Add upstream remote
git remote add upstream https://github.com/Horlabrainmoore/brainpay-os.git

# 4. Install dependencies
npm install
cd functions && npm install && cd ..

# 5. Start development
npm run dev
# → Open http://localhost:5173
```

---

## Git Workflow

### 1. Sync Latest Main

```bash
git fetch upstream
git switch main
git rebase upstream/main
```

### 2. Create Feature Branch

Use branch naming convention:

```bash
# Feature
git switch -c feat/scope/short-description
# Example:
git switch -c feat/payments/stripe-onramp-widget

# Bug fix
git switch -c fix/scope/short-description
# Example:
git switch -c fix/wallet/address-validation-bug

# Documentation
git switch -c docs/short-description
# Example:
git switch -c docs/mempool-api-guide

# Chore (cleanup, deps, etc)
git switch -c chore/scope/short-description
```

### 3. Make Changes

```bash
# Work on your feature
code src/pages/MyFeature.tsx

# Check status
git status

# Stage changes
git add .
# Or specific files:
git add src/pages/MyFeature.tsx

# Verify changes
git diff --staged
```

### 4. Commit with Conventional Commits

Use the format: `type(scope): subject`

```bash
# Feature
git commit -m "feat(payments): add stripe onramp integration"

# Bug fix
git commit -m "fix(wallet): resolve address validation error"

# Documentation
git commit -m "docs(api): add mempool endpoint examples"

# Tests
git commit -m "test(mempool): add address stats tests"

# Refactoring
git commit -m "refactor(hooks): simplify useMempoolBtc hook"

# Security
git commit -m "security(env): remove exposed api keys from logs"
```

**Commit Message Best Practices**:

```
feat(scope): short summary (max 50 chars)

Optional detailed body explaining:
- What changed
- Why it changed
- Side effects or breaking changes

Closes #123  (reference issue number)
```

### 5. Keep Branch Updated

If main has updates while you work:

```bash
# Rebase your branch onto latest main
git fetch upstream
git rebase upstream/main

# If conflicts occur:
# 1. Resolve conflicts in your editor
# 2. git add <resolved-files>
# 3. git rebase --continue
```

### 6. Push to Your Fork

```bash
# First push (sets upstream)
git push -u origin feat/payments/stripe-onramp

# Subsequent pushes
git push

# After rebase (force-with-lease is safer than force)
git push --force-with-lease
```

### 7. Open Pull Request

1. Go to https://github.com/Horlabrainmoore/brainpay-os
2. Click "New Pull Request"
3. Select your branch
4. Fill out PR template:
   - Summary
   - Related issues
   - Changes (Added/Changed/Fixed)
   - How to test
   - Security considerations
   - Deployment notes
5. Request reviewers
6. Wait for CI checks & reviews

### 8. Address Feedback

```bash
# Make requested changes
code src/pages/MyFeature.tsx

# Commit (use --amend to add to last commit, or make new commit)
git add .
git commit -m "fix: address review feedback"

# Push
git push
```

### 9. Merge & Cleanup

Once approved:

```bash
# Merge button on GitHub (prefer "Squash and merge" to keep main clean)

# Delete local branch
git switch main
git branch -d feat/payments/stripe-onramp

# Delete remote branch
git push origin --delete feat/payments/stripe-onramp
```

---

## Commit Conventions

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation
- **test**: Tests
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **chore**: Build, deps, tooling
- **security**: Security fixes
- **ci**: CI/CD changes

### Scopes

Use meaningful scopes:

- `payments` — Payment-related code
- `mempool` — Blockchain data
- `wallet` — Wallet management
- `auth` — Authentication
- `ui` — User interface
- `api` — Backend APIs
- `docs` — Documentation
- `deps` — Dependencies

### Examples

```
feat(mempool): add real-time fee estimation
fix(wallet): handle invalid bitcoin addresses gracefully
docs(setup): add Firebase configuration guide
test(mempool): add address stats integration tests
refactor(hooks): simplify useMempoolBtc hook
perf(queries): optimize firestore queries with indexes
chore(deps): upgrade react to 18.3
security(env): move api keys to GitHub secrets
```

---

## Code Style

### TypeScript

```typescript
// ✅ Good
interface UserWallet {
  address: string;
  balance: number;
  lastUpdated: Date;
}

function getWalletBalance(address: string): Promise<number> {
  // Implementation
}

// ❌ Bad
interface user_wallet {
  address: string;
  balance: any; // Avoid 'any'
}

function getWalletBalance(address) {
  // Missing type annotation
}
```

### React

```typescript
// ✅ Good
export function WalletCard({ address }: { address: string }) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Fetch data
  }, [address]);

  return <div>{balance} BTC</div>;
}

// ❌ Bad
export function WalletCard({ address }) {
  useEffect(() => {
    // No dependency array = runs every render
  });

  return <div>{balance} BTC</div>;
}
```

### Naming

- **Components**: PascalCase (e.g., `WalletCard`)
- **Functions**: camelCase (e.g., `getWalletBalance`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_WALLET_SIZE`)
- **Files**: kebab-case (e.g., `wallet-card.tsx`)

### Linting

```bash
# Check linting
npm run lint

# Fix automatically
npm run lint -- --fix
```

---

## Testing

### Unit Tests

```typescript
// src/lib/__tests__/btc-address.test.ts
import { validateBitcoinAddress } from '@/lib/btc-address';

describe('Bitcoin Address Validation', () => {
  it('should validate mainnet bech32 addresses', () => {
    const result = validateBitcoinAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
    expect(result.valid).toBe(true);
    expect(result.kind).toBe('Bech32 (P2WPKH/P2WSH)');
  });

  it('should reject invalid addresses', () => {
    const result = validateBitcoinAddress('invalid-address');
    expect(result.valid).toBe(false);
  });
});
```

### Running Tests

```bash
npm run test         # Run once
npm run test:watch  # Watch mode
```

---

## Documentation

### Inline Comments

```typescript
// ✅ Good: Explains WHY, not WHAT
function getAddressStats(address: string) {
  // Cache for 1 minute to reduce API calls
  staleTime: 60 * 1000,
}

// ❌ Bad: States the obvious
function getAddressStats(address: string) {
  // Get address stats
  const stats = fetchAddress(address);
}
```

### Function Documentation

```typescript
/**
 * Fetch Bitcoin address statistics from Mempool API
 *
 * @param address - Bitcoin address (P2PKH, P2SH, or Bech32)
 * @returns Promise<AddressStats> - Balance, tx count, and unconfirmed balance
 * @throws Error if address is invalid or API fails
 *
 * @example
 * const stats = await getAddressStats('bc1qar0...');
 * console.log(stats.balanceBtc); // 0.5234
 */
export async function getAddressStats(address: string): Promise<AddressStats> {
  // Implementation
}
```

---

## Security

### Secrets Management

```bash
# ❌ NEVER commit secrets
git add .env.local  # DON'T DO THIS

# ✅ Use GitHub Actions secrets
echo "**/env.local" >> .gitignore
```

### Code Review Checklist

- [ ] No secrets in diff
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Proper error handling
- [ ] Input validation
- [ ] No N+1 queries

### Report Security Issues

Do NOT open public issues for security vulnerabilities.

Email: [security contact]

---

## Pull Request Process

### Before Submitting

- [ ] Branch is up-to-date with main
- [ ] All tests pass locally
- [ ] Linting passes
- [ ] No console errors or warnings
- [ ] PR template filled out
- [ ] Commit messages follow conventions

### Reviewer Expectations

- Will receive feedback within 48 hours
- May request changes or clarifications
- Will approve when ready
- May suggest improvements (optional)

### Approval & Merge

- Requires at least 1 approval
- CI checks must pass
- Prefer "Squash and merge" to keep main clean
- Auto-deploys to Vercel on merge

---

## Deployment

### Frontend (Vercel)

```bash
# Auto-deploys on main push
# Preview deployments on all PRs
# Environment variables synced from GitHub
```

### Backend (Firebase)

```bash
# Deploy functions
cd functions
npm run build
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Issues**: Search existing issues first
- **Documentation**: Check docs/ folder
- **Slack/Discord**: (if applicable)

---

## Recognition

Contributors will be:
- Added to CONTRIBUTORS.md
- Mentioned in release notes
- Featured on GitHub

---

## License

By contributing, you agree your code will be licensed under the MIT License.

---

**Thank you for contributing to BrainPay-OS! 🙏**
