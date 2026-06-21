// Centralized telemetry helpers (web)
import { getAnalytics, logEvent, type Analytics } from "firebase/analytics";
import { firebaseApp, isFirebaseConfigured } from "./firebase";

let analytics: Analytics | null = null;
if (firebaseApp && typeof window !== "undefined") {
  try {
    analytics = getAnalytics(firebaseApp);
  } catch {
    analytics = null;
  }
}

export const analyticsReady = () => Boolean(analytics);

export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (!analytics) {
    if (!isFirebaseConfigured) {
      // Helpful local-dev breadcrumb when env vars are missing.
      // eslint-disable-next-line no-console
      console.info("[analytics:noop]", name, params);
    }
    return false;
  }
  try {
    logEvent(analytics, name as string, params as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
};

export const trackWalletConnected = (wallet: string) => trackEvent("wallet_connected", { wallet });
export const trackInvoiceCreated = (amount: number) => trackEvent("btc_invoice_created", { amount });
export const trackPaymentReceived = (txid: string) => trackEvent("btc_payment_received", { txid });
export const trackGeneric = (name: string, payload?: Record<string, unknown>) => trackEvent(name, payload);
