/**
 * PIN hashing — compatible HTTP et HTTPS.
 * - Web Crypto disponible → SHA-256 natif (HTTPS)
 * - Sinon → crypto-js en JS pur (HTTP, vieux mobiles)
 * Résultat identique partout.
 * 100% offline, 100% client-side.
 */

import CryptoJS from "crypto-js";

function hasWebCrypto(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.digest === "function"
  );
}

async function sha256Native(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sha256Fallback(input: string): string {
  return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
}

async function sha256(input: string): Promise<string> {
  if (hasWebCrypto()) {
    try {
      return await sha256Native(input);
    } catch {
      return sha256Fallback(input);
    }
  }
  return sha256Fallback(input);
}

/**
 * Hash un PIN avec un salt (nom utilisateur en majuscules).
 * Format : `PIN|NOM_EN_MAJUSCULES`
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256(`${pin}|${salt.toUpperCase()}`);
}

/**
 * Vérifier un PIN contre un hash stocké.
 */
export async function verifyPin(
  pin: string,
  salt: string,
  hash: string
): Promise<boolean> {
  const computed = await hashPin(pin, salt);
  return computed === hash;
}

/**
 * Générer un PIN aléatoire 4 chiffres.
 */
export function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Hash synchrone pour les scripts Node.js.
 */
export function hashPinSync(pin: string, salt: string): string {
  return CryptoJS.SHA256(`${pin}|${salt.toUpperCase()}`).toString(CryptoJS.enc.Hex);
}