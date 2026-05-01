/**
 * Client-side encryption helpers for storing 3rd-party API keys.
 *
 * Keys are encrypted in the browser with a passphrase the user provides.
 * The passphrase is NEVER sent to the server. Only ciphertext + IV are stored.
 *
 * AES-GCM 256, PBKDF2-SHA256 200k iterations, salt derived from user id.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function b64decode(str: string): Uint8Array {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(passphrase: string, userId: string): Promise<CryptoKey> {
  const salt = await crypto.subtle.digest("SHA-256", enc.encode(`brainpay:${userId}`));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptValue(plaintext: string, passphrase: string, userId: string) {
  const key = await deriveKey(passphrase, userId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  return { ciphertext: b64encode(ct), iv: b64encode(iv.buffer) };
}

export async function decryptValue(
  ciphertext: string,
  ivB64: string,
  passphrase: string,
  userId: string,
): Promise<string> {
  const key = await deriveKey(passphrase, userId);
  const iv = b64decode(ivB64);
  const ct = b64decode(ciphertext);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
  return dec.decode(pt);
}
