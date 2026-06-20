// src/lib/remoteConfig.ts
import { initializeApp } from "firebase/app";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
};

const app = initializeApp(firebaseConfig);
const rc = getRemoteConfig(app);
rc.settings.minimumFetchIntervalMillis = 60 * 1000; // 1 minute for dev; adjust in prod

export async function activateRemoteConfig() {
  try {
    await fetchAndActivate(rc);
  } catch (e) {
    // ignore
  }
}

export function getFlagBoolean(key: string, fallback = false) {
  try {
    const val = getValue(rc, key);
    return val.asBoolean();
  } catch (e) {
    return fallback;
  }
}
