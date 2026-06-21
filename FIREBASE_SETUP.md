# Firebase Setup (Analytics + Remote Config)

BrainPay-OS uses the Firebase Web SDK for client telemetry (Analytics) and
runtime feature flags / strings (Remote Config). Everything is initialized
once in `src/lib/firebase.ts` and re-used by `src/lib/analytics.ts` and
`src/lib/remoteConfig.ts`.

## 1. Install

Already installed by Lovable:

```bash
bun add firebase
```

If you ever need to re-install manually:

```bash
npm i firebase        # or: pnpm add firebase / yarn add firebase
```

Modular sub-packages used:

- `firebase/app` — core app handle
- `firebase/analytics` — `getAnalytics`, `logEvent`
- `firebase/remote-config` — `getRemoteConfig`, `fetchAndActivate`, `getValue`

## 2. Create a Firebase project + Web App

1. <https://console.firebase.google.com> → **Add project**
2. In project settings, **Add app → Web (</>)**, register, and copy the
   `firebaseConfig` snippet shown.
3. In the left nav, enable **Analytics** (links a GA4 property) and
   **Remote Config** (create at least one parameter — see §5).

## 3. Environment variables

Vite only exposes vars prefixed with `VITE_`. Create a `.env.local` (git-ignored)
in the project root:

```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXX
```

These keys are **publishable** (they identify the Firebase project, they don't
grant write access on their own). Security comes from Firebase Security Rules,
App Check, and Authorized Domains — not from hiding the keys.

After editing `.env.local`, restart the dev server so Vite picks up the new
variables.

### Deployment (Lovable Cloud preview/published)

Set the same `VITE_*` variables in **Project Settings → Environment Variables**
for the deployed build. They are baked into the bundle at build time.

### Authorized domains

In Firebase Console → **Authentication → Settings → Authorized domains**,
add:

- `localhost`
- Your Lovable preview domain (e.g. `*.lovable.app`)
- Your published / custom domain

Analytics will silently no-op on unauthorized origins.

## 4. Verify in the UI

Open **Settings → Diagnostics**. You'll see:

- **Remote Config** card showing the value of the `welcome_message` parameter
  (with a fallback default if the fetch fails).
- **Analytics test event** button that fires `diagnostic_ping` via
  `logEvent(...)`. Confirm receipt in Firebase Console → **Analytics → DebugView**.

To enable DebugView from the browser, append `?firebase_debug=1` to the URL
or install the **Google Analytics Debugger** Chrome extension.

## 5. Add a Remote Config parameter

Firebase Console → **Remote Config → Add parameter**:

| Key                | Default value                  | Notes                          |
| ------------------ | ------------------------------ | ------------------------------ |
| `welcome_message`  | `Welcome to BrainPay (live)`   | Read by the Diagnostics card   |
| `feature_live_blocks` | `true`                      | Example boolean flag           |

Click **Publish changes**. The client refetches every 60 s in dev (configured
in `src/lib/remoteConfig.ts`). Bump `minimumFetchIntervalMillis` for prod.

## 6. Files of interest

- `src/lib/firebase.ts` — shared app instance, env validation
- `src/lib/analytics.ts` — `trackEvent`, `trackWalletConnected`, …
- `src/lib/remoteConfig.ts` — `activateRemoteConfig`, `getFlagString`, `getFlagBoolean`
- `src/components/FirebaseDiagnostics.tsx` — UI panel
