import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config";
import { firebaseApp } from "./firebase";

let rc: RemoteConfig | null = null;
if (firebaseApp && typeof window !== "undefined") {
  try {
    rc = getRemoteConfig(firebaseApp);
    rc.settings.minimumFetchIntervalMillis = 60 * 1000;
    rc.defaultConfig = {
      welcome_message: "Welcome to BrainPay",
      feature_live_blocks: true,
    };
  } catch {
    rc = null;
  }
}

export const remoteConfigReady = () => Boolean(rc);

export async function activateRemoteConfig(): Promise<boolean> {
  if (!rc) return false;
  try {
    return await fetchAndActivate(rc);
  } catch {
    return false;
  }
}

export function getFlagBoolean(key: string, fallback = false) {
  if (!rc) return fallback;
  try { return getValue(rc, key).asBoolean(); } catch { return fallback; }
}

export function getFlagString(key: string, fallback = "") {
  if (!rc) return fallback;
  try {
    const v = getValue(rc, key).asString();
    return v || fallback;
  } catch {
    return fallback;
  }
}
