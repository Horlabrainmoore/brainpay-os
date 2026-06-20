// src/lib/crashlytics.ts
// Minimal client-side crash reporter. Avoids depending on native Crashlytics.
import { trackGeneric } from "./analytics";

export function installGlobalErrorHandlers(reportEndpoint?: string) {
  window.addEventListener("error", (event) => {
    try {
      const payload = {
        message: event.error?.message || event.message || "unknown",
        stack: event.error?.stack || null,
        filename: (event as ErrorEvent).filename || null,
        lineno: (event as ErrorEvent).lineno || null,
        colno: (event as ErrorEvent).colno || null,
        userAgent: navigator.userAgent,
        ts: Date.now(),
      };
      trackGeneric("client_error", payload as any);
      if (reportEndpoint) {
        void fetch(reportEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      // swallow
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const payload = {
        message: event.reason?.message || String(event.reason) || "unhandledrejection",
        stack: event.reason?.stack || null,
        userAgent: navigator.userAgent,
        ts: Date.now(),
      };
      trackGeneric("client_unhandledrejection", payload as any);
      if (reportEndpoint) {
        void fetch(reportEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
    } catch (e) {
      // swallow
    }
  });
}
