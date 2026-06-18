// src/lib/analytics.ts
// Centralized telemetry helpers (web)
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  try {
    logEvent(analytics, name, params);
  } catch (err) {
    // swallow: analytics should not crash the app
    // consider sending to a backup endpoint
    // console.warn("analytics error", err);
  }
};

export const trackWalletConnected = (wallet: string) => trackEvent("wallet_connected", { wallet });
export const trackInvoiceCreated = (amount: number) => trackEvent("btc_invoice_created", { amount });
export const trackPaymentReceived = (txid: string) => trackEvent("btc_payment_received", { txid });
export const trackGeneric = (name: string, payload?: Record<string, unknown>) => trackEvent(name, payload);
